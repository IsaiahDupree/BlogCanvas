'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Report {
    id: string;
    report_type: string;
    period_start: string;
    period_end: string;
    created_at: string;
    website: {
        id: string;
        url: string;
        name: string;
        client: {
            id: string;
            name: string;
        };
    };
}

export default function ReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showGenerateForm, setShowGenerateForm] = useState(false);

    useEffect(() => {
        fetchReports();
    }, []);

    async function fetchReports() {
        try {
            setLoading(true);
            const response = await fetch('/api/reports');
            const data = await response.json();

            if (data.success) {
                setReports(data.reports);
            } else {
                setError(data.error || 'Failed to fetch reports');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getReportTypeIcon = (type: string) => {
        switch (type) {
            case 'pdf':
                return '📄';
            case 'email':
                return '📧';
            case 'slide_deck':
                return '📊';
            default:
                return '📝';
        }
    };

    const getReportTypeName = (type: string) => {
        switch (type) {
            case 'pdf':
                return 'PDF Report';
            case 'email':
                return 'Email Report';
            case 'slide_deck':
                return 'Slide Deck';
            default:
                return type;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900">Reports</h1>
                        <p className="text-slate-600 mt-2">View and manage your SEO performance reports</p>
                    </div>
                    <button
                        onClick={() => setShowGenerateForm(true)}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-lg"
                    >
                        + Generate Report
                    </button>
                </div>

                {/* Generate Report Form */}
                {showGenerateForm && (
                    <GenerateReportForm
                        onClose={() => setShowGenerateForm(false)}
                        onGenerated={() => {
                            setShowGenerateForm(false);
                            fetchReports();
                        }}
                    />
                )}

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        <p className="text-slate-600 mt-4">Loading reports...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                {/* Reports Grid */}
                {!loading && !error && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reports.length === 0 ? (
                            <div className="col-span-full text-center py-12">
                                <p className="text-slate-600 text-lg">No reports yet. Generate your first report to get started!</p>
                            </div>
                        ) : (
                            reports.map((report) => (
                                <ReportCard key={report.id} report={report} onRefresh={fetchReports} />
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function ReportCard({ report, onRefresh }: { report: Report; onRefresh: () => void }) {
    const [downloading, setDownloading] = useState(false);
    const [sending, setSending] = useState(false);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getReportTypeIcon = (type: string) => {
        switch (type) {
            case 'pdf':
                return '📄';
            case 'email':
                return '📧';
            case 'slide_deck':
                return '📊';
            default:
                return '📝';
        }
    };

    const getReportTypeName = (type: string) => {
        switch (type) {
            case 'pdf':
                return 'PDF Report';
            case 'email':
                return 'Email Report';
            case 'slide_deck':
                return 'Slide Deck';
            default:
                return type;
        }
    };

    async function handleDownload() {
        if (report.report_type !== 'pdf') return;

        try {
            setDownloading(true);
            const response = await fetch(`/api/reports/${report.id}/download`);

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `report_${report.id}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                alert('Failed to download report');
            }
        } catch (error) {
            console.error('Download error:', error);
            alert('An error occurred while downloading');
        } finally {
            setDownloading(false);
        }
    }

    async function handleSendEmail() {
        try {
            setSending(true);
            const response = await fetch(`/api/reports/${report.id}/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });

            const data = await response.json();

            if (data.success) {
                alert('Email sent successfully!');
            } else {
                alert(`Failed to send email: ${data.error}`);
            }
        } catch (error) {
            console.error('Send error:', error);
            alert('An error occurred while sending email');
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-3xl">{getReportTypeIcon(report.report_type)}</span>
                    <div>
                        <h3 className="font-semibold text-slate-900">{getReportTypeName(report.report_type)}</h3>
                        <p className="text-sm text-slate-500">{report.website?.client?.name || 'Unknown Client'}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-2 mb-4 text-sm">
                <div>
                    <span className="text-slate-600">Website:</span>{' '}
                    <span className="text-slate-900">{report.website?.url || 'Unknown'}</span>
                </div>
                <div>
                    <span className="text-slate-600">Period:</span>{' '}
                    <span className="text-slate-900">
                        {formatDate(report.period_start)} - {formatDate(report.period_end)}
                    </span>
                </div>
                <div>
                    <span className="text-slate-600">Generated:</span>{' '}
                    <span className="text-slate-900">{formatDate(report.created_at)}</span>
                </div>
            </div>

            <div className="flex gap-2">
                {report.report_type === 'pdf' && (
                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                    >
                        {downloading ? 'Downloading...' : 'Download PDF'}
                    </button>
                )}
                <button
                    onClick={handleSendEmail}
                    disabled={sending}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                    {sending ? 'Sending...' : 'Send Email'}
                </button>
            </div>
        </div>
    );
}

function GenerateReportForm({ onClose, onGenerated }: { onClose: () => void; onGenerated: () => void }) {
    const [websites, setWebsites] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        websiteId: '',
        periodStart: '',
        periodEnd: '',
        format: 'email' as 'email' | 'pdf' | 'slide'
    });

    useEffect(() => {
        fetchWebsites();
    }, []);

    async function fetchWebsites() {
        try {
            const response = await fetch('/api/websites');
            const data = await response.json();
            if (data.success) {
                setWebsites(data.websites || []);
            }
        } catch (error) {
            console.error('Failed to fetch websites:', error);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!formData.websiteId || !formData.periodStart || !formData.periodEnd) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('/api/reports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                alert('Report generated successfully!');
                onGenerated();
            } else {
                alert(`Failed to generate report: ${data.error}`);
            }
        } catch (error) {
            console.error('Generate error:', error);
            alert('An error occurred while generating the report');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Generate Report</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Website *
                        </label>
                        <select
                            value={formData.websiteId}
                            onChange={(e) => setFormData({ ...formData, websiteId: e.target.value })}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        >
                            <option value="">Select a website</option>
                            {websites.map((website) => (
                                <option key={website.id} value={website.id}>
                                    {website.url}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Period Start *
                        </label>
                        <input
                            type="date"
                            value={formData.periodStart}
                            onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Period End *
                        </label>
                        <input
                            type="date"
                            value={formData.periodEnd}
                            onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Format *
                        </label>
                        <select
                            value={formData.format}
                            onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        >
                            <option value="email">Email Report</option>
                            <option value="pdf">PDF Report</option>
                            <option value="slide">Slide Deck</option>
                        </select>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            {loading ? 'Generating...' : 'Generate'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
