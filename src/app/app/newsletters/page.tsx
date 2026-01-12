'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NewsletterBuilder, NewsletterBlock } from '@/components/newsletters/NewsletterBuilder';

interface NewsletterCampaign {
    id: string;
    subject: string;
    preview_text: string | null;
    html_content: string;
    json_content: any;
    status: string;
    scheduled_at: string | null;
    sent_at: string | null;
    recipient_count: number;
    created_at: string;
    newsletter_templates?: {
        name: string;
    };
}

interface NewsletterTemplate {
    id: string;
    name: string;
    description: string | null;
    html_content: string;
    json_content: any;
    is_system_template: boolean;
    created_at: string;
}

export default function NewslettersPage() {
    const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
    const [templates, setTemplates] = useState<NewsletterTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<NewsletterTemplate | null>(null);

    // Fetch campaigns and templates
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [campaignsRes, templatesRes] = await Promise.all([
                fetch('/api/newsletters/campaigns'),
                fetch('/api/newsletters/templates')
            ]);

            if (campaignsRes.ok) {
                const { campaigns } = await campaignsRes.json();
                setCampaigns(campaigns || []);
            }

            if (templatesRes.ok) {
                const { templates } = await templatesRes.json();
                setTemplates(templates || []);
            }
        } catch (error) {
            console.error('Error fetching newsletters data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-gray-100 text-gray-800';
            case 'scheduled': return 'bg-blue-100 text-blue-800';
            case 'sending': return 'bg-yellow-100 text-yellow-800';
            case 'sent': return 'bg-green-100 text-green-800';
            case 'failed': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'draft': return '📝';
            case 'scheduled': return '⏰';
            case 'sending': return '📨';
            case 'sent': return '✅';
            case 'failed': return '❌';
            default: return '📄';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        Newsletters
                    </h1>
                    <p className="text-gray-600">Create and send beautiful newsletters to your clients</p>
                </div>

                {/* Create New Button */}
                <div className="mb-6">
                    <button
                        onClick={() => setShowCreateDialog(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <span>📧</span>
                        Create Newsletter
                    </button>
                </div>

                {/* Tabs */}
                <div className="mb-6 border-b border-gray-200">
                    <div className="flex gap-6">
                        <button className="pb-3 border-b-2 border-indigo-600 text-indigo-600 font-medium">
                            Campaigns ({campaigns.length})
                        </button>
                        <button className="pb-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium">
                            Templates ({templates.length})
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                        <p className="mt-4 text-gray-600">Loading newsletters...</p>
                    </div>
                )}

                {/* Campaigns Grid */}
                {!loading && campaigns.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                        <div className="text-6xl mb-4">📧</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No newsletters yet</h3>
                        <p className="text-gray-600 mb-6">Create your first newsletter to get started</p>
                        <button
                            onClick={() => setShowCreateDialog(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                            Create Newsletter
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {campaigns.map((campaign) => (
                            <CampaignCard
                                key={campaign.id}
                                campaign={campaign}
                                onRefresh={fetchData}
                                getStatusColor={getStatusColor}
                                getStatusIcon={getStatusIcon}
                            />
                        ))}
                    </div>
                )}

                {/* Create Dialog */}
                {showCreateDialog && (
                    <CreateNewsletterDialog
                        templates={templates}
                        onClose={() => {
                            setShowCreateDialog(false);
                            setSelectedTemplate(null);
                        }}
                        onCreated={() => {
                            fetchData();
                            setShowCreateDialog(false);
                            setSelectedTemplate(null);
                        }}
                    />
                )}
            </div>
        </div>
    );
}

// Campaign Card Component
function CampaignCard({
    campaign,
    onRefresh,
    getStatusColor,
    getStatusIcon
}: {
    campaign: NewsletterCampaign;
    onRefresh: () => void;
    getStatusColor: (status: string) => string;
    getStatusIcon: (status: string) => string;
}) {
    const router = useRouter();
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (!confirm('Are you sure you want to send this newsletter?')) return;

        setSending(true);
        try {
            const response = await fetch(`/api/newsletters/campaigns/${campaign.id}/send`, {
                method: 'POST'
            });

            if (response.ok) {
                alert('Newsletter sent successfully!');
                onRefresh();
            } else {
                const { error } = await response.json();
                alert(`Failed to send newsletter: ${error}`);
            }
        } catch (error) {
            console.error('Error sending newsletter:', error);
            alert('Failed to send newsletter');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            {/* Status Badge */}
            <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                    {getStatusIcon(campaign.status)} {campaign.status.toUpperCase()}
                </span>
                {campaign.newsletter_templates && (
                    <span className="text-xs text-gray-500">
                        {campaign.newsletter_templates.name}
                    </span>
                )}
            </div>

            {/* Subject */}
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{campaign.subject}</h3>

            {/* Preview Text */}
            {campaign.preview_text && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{campaign.preview_text}</p>
            )}

            {/* Meta Info */}
            <div className="text-xs text-gray-500 space-y-1 mb-4">
                <div>Recipients: {campaign.recipient_count}</div>
                {campaign.sent_at && (
                    <div>Sent: {new Date(campaign.sent_at).toLocaleDateString()}</div>
                )}
                {campaign.scheduled_at && (
                    <div>Scheduled: {new Date(campaign.scheduled_at).toLocaleDateString()}</div>
                )}
                <div>Created: {new Date(campaign.created_at).toLocaleDateString()}</div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                    {campaign.status === 'draft' && (
                        <button
                            onClick={handleSend}
                            disabled={sending}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                        >
                            {sending ? 'Sending...' : 'Send Now'}
                        </button>
                    )}
                    <button className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded text-sm font-medium transition-colors">
                        Preview
                    </button>
                </div>
                <button
                    onClick={() => router.push(`/app/newsletters/${campaign.id}/recipients`)}
                    className="w-full border border-indigo-300 hover:bg-indigo-50 text-indigo-700 px-4 py-2 rounded text-sm font-medium transition-colors"
                >
                    Manage Recipients ({campaign.recipient_count})
                </button>
            </div>
        </div>
    );
}

// Create Newsletter Dialog
function CreateNewsletterDialog({
    templates,
    onClose,
    onCreated
}: {
    templates: NewsletterTemplate[];
    onClose: () => void;
    onCreated: () => void;
}) {
    const [step, setStep] = useState<'template' | 'build' | 'configure'>('template');
    const [selectedTemplate, setSelectedTemplate] = useState<NewsletterTemplate | null>(null);
    const [blocks, setBlocks] = useState<NewsletterBlock[]>([]);
    const [htmlContent, setHtmlContent] = useState('');
    const [subject, setSubject] = useState('');
    const [previewText, setPreviewText] = useState('');
    const [recipientEmails, setRecipientEmails] = useState('');
    const [creating, setCreating] = useState(false);

    const handleTemplateSelect = (template: NewsletterTemplate) => {
        setSelectedTemplate(template);
        if (template.json_content?.blocks) {
            setBlocks(template.json_content.blocks);
        }
        setHtmlContent(template.html_content);
        setStep('build');
    };

    const handleBuilderChange = (newBlocks: NewsletterBlock[], newHtml: string) => {
        setBlocks(newBlocks);
        setHtmlContent(newHtml);
    };

    const handleCreate = async () => {
        if (!subject || !htmlContent) {
            alert('Please fill in subject and content');
            return;
        }

        const emails = recipientEmails
            .split(/[\n,]/)
            .map(e => e.trim())
            .filter(e => e.includes('@'));

        if (emails.length === 0) {
            alert('Please add at least one recipient email');
            return;
        }

        setCreating(true);
        try {
            const response = await fetch('/api/newsletters/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    template_id: selectedTemplate?.id,
                    subject,
                    preview_text: previewText,
                    html_content: htmlContent,
                    json_content: { blocks },
                    recipient_emails: emails
                })
            });

            if (response.ok) {
                onCreated();
            } else {
                const { error } = await response.json();
                alert(`Failed to create newsletter: ${error}`);
            }
        } catch (error) {
            console.error('Error creating newsletter:', error);
            alert('Failed to create newsletter');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {step === 'template' && 'Choose Template'}
                        {step === 'build' && 'Build Newsletter'}
                        {step === 'configure' && 'Configure & Send'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {step === 'template' && (
                        <div>
                            <p className="text-gray-600 mb-6">Select a template to get started</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {templates.map((template) => (
                                    <button
                                        key={template.id}
                                        onClick={() => handleTemplateSelect(template)}
                                        className="text-left border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-400 transition-colors"
                                    >
                                        <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                                        {template.description && (
                                            <p className="text-sm text-gray-600">{template.description}</p>
                                        )}
                                        {template.is_system_template && (
                                            <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                System
                                            </span>
                                        )}
                                    </button>
                                ))}
                                <button
                                    onClick={() => { setStep('build'); }}
                                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-indigo-400 transition-colors flex flex-col items-center justify-center min-h-[120px]"
                                >
                                    <span className="text-4xl mb-2">+</span>
                                    <span className="font-medium text-gray-700">Start from Scratch</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'build' && (
                        <div>
                            <NewsletterBuilder
                                initialBlocks={blocks}
                                onChange={handleBuilderChange}
                            />
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={() => setStep('template')}
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => setStep('configure')}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'configure' && (
                        <div className="max-w-2xl mx-auto space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Subject Line *
                                </label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Enter email subject..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Preview Text
                                </label>
                                <input
                                    type="text"
                                    value={previewText}
                                    onChange={(e) => setPreviewText(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Text shown in email preview..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Recipients *
                                </label>
                                <textarea
                                    value={recipientEmails}
                                    onChange={(e) => setRecipientEmails(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    rows={5}
                                    placeholder="Enter email addresses (one per line or comma-separated)&#10;example@client1.com&#10;contact@client2.com"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={() => setStep('build')}
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={creating}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                                >
                                    {creating ? 'Creating...' : 'Create Campaign'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
