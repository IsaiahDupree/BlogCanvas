'use client';

/**
 * Email Templates & Queue Management Page
 * /app/emails
 *
 * Displays transactional email templates and queue statistics
 */

import { useState, useEffect } from 'react';

interface EmailTemplate {
    id: string;
    template_key: string;
    name: string;
    description: string;
    subject_template: string;
    variables: string[];
    is_system_template: boolean;
    is_active: boolean;
}

interface QueueStats {
    pending: number;
    sending: number;
    sent: number;
    failed: number;
}

export default function EmailsPage() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [queueStats, setQueueStats] = useState<QueueStats>({ pending: 0, sending: 0, sent: 0, failed: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
    const [testEmailData, setTestEmailData] = useState<{ to: string; variables: Record<string, string> }>({
        to: '',
        variables: {}
    });

    useEffect(() => {
        fetchTemplates();
        fetchQueueStats();

        // Refresh queue stats every 30 seconds
        const interval = setInterval(fetchQueueStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await fetch('/api/emails/templates');
            if (response.ok) {
                const data = await response.json();
                setTemplates(data.templates || []);
            }
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchQueueStats = async () => {
        try {
            const response = await fetch('/api/emails/queue/stats');
            if (response.ok) {
                const data = await response.json();
                setQueueStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch queue stats:', error);
        }
    };

    const handleSendTestEmail = async () => {
        if (!selectedTemplate || !testEmailData.to) {
            alert('Please select a template and enter recipient email');
            return;
        }

        try {
            const response = await fetch('/api/emails/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    templateKey: selectedTemplate.template_key,
                    to: testEmailData.to,
                    variables: testEmailData.variables
                })
            });

            if (response.ok) {
                alert('Email queued successfully!');
                fetchQueueStats();
            } else {
                const error = await response.json();
                alert(`Failed to send: ${error.error}`);
            }
        } catch (error) {
            console.error('Failed to send test email:', error);
            alert('Failed to send test email');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Email System</h1>
                    <p className="text-gray-600">Manage transactional email templates and queue</p>
                </div>

                {/* Queue Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pending</p>
                                <p className="text-3xl font-bold text-yellow-600">{queueStats.pending}</p>
                            </div>
                            <div className="bg-yellow-100 rounded-full p-3">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Sending</p>
                                <p className="text-3xl font-bold text-blue-600">{queueStats.sending}</p>
                            </div>
                            <div className="bg-blue-100 rounded-full p-3">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Sent</p>
                                <p className="text-3xl font-bold text-green-600">{queueStats.sent}</p>
                            </div>
                            <div className="bg-green-100 rounded-full p-3">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Failed</p>
                                <p className="text-3xl font-bold text-red-600">{queueStats.failed}</p>
                            </div>
                            <div className="bg-red-100 rounded-full p-3">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Email Templates */}
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Email Templates</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {templates.map((template) => (
                            <div
                                key={template.id}
                                className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                                    selectedTemplate?.id === template.id
                                        ? 'border-indigo-500 bg-indigo-50'
                                        : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
                                }`}
                                onClick={() => {
                                    setSelectedTemplate(template);
                                    // Initialize variables object for test email
                                    const vars: Record<string, string> = {};
                                    template.variables.forEach(v => vars[v] = '');
                                    setTestEmailData({ to: '', variables: vars });
                                }}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                                    </div>
                                    {template.is_system_template && (
                                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                            System
                                        </span>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <p className="text-sm text-gray-500 mb-1">Subject:</p>
                                    <p className="text-sm text-gray-700 font-mono bg-gray-50 p-2 rounded">
                                        {template.subject_template}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Variables:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {template.variables.map((variable) => (
                                            <span
                                                key={variable}
                                                className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded font-mono"
                                            >
                                                {`{{${variable}}}`}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Test Email Form */}
                    {selectedTemplate && (
                        <div className="mt-8 border-t pt-8">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Send Test Email</h3>
                            <div className="max-w-2xl">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Recipient Email
                                    </label>
                                    <input
                                        type="email"
                                        value={testEmailData.to}
                                        onChange={(e) => setTestEmailData({ ...testEmailData, to: e.target.value })}
                                        placeholder="test@example.com"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Template Variables
                                    </label>
                                    <div className="space-y-3">
                                        {selectedTemplate.variables.map((variable) => (
                                            <div key={variable}>
                                                <label className="block text-xs text-gray-600 mb-1">{variable}</label>
                                                <input
                                                    type="text"
                                                    value={testEmailData.variables[variable] || ''}
                                                    onChange={(e) => setTestEmailData({
                                                        ...testEmailData,
                                                        variables: {
                                                            ...testEmailData.variables,
                                                            [variable]: e.target.value
                                                        }
                                                    })}
                                                    placeholder={`Enter ${variable}`}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleSendTestEmail}
                                    className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                                >
                                    Queue Test Email
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Setup Instructions */}
                <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">Setup Required</h3>
                            <div className="mt-2 text-sm text-yellow-700">
                                <p className="mb-2">To enable the email system:</p>
                                <ol className="list-decimal list-inside space-y-1 ml-2">
                                    <li>Apply database migration: <code className="bg-yellow-100 px-1 rounded">npx supabase db push</code></li>
                                    <li>Configure <code className="bg-yellow-100 px-1 rounded">RESEND_API_KEY</code> in .env.local</li>
                                    <li>Set up cron job for <code className="bg-yellow-100 px-1 rounded">/api/emails/queue/process</code></li>
                                    <li>See <code className="bg-yellow-100 px-1 rounded">docs/TRANSACTIONAL_EMAIL_SETUP.md</code> for details</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
