'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ScheduledReport {
    id: string;
    name: string;
    description: string;
    report_type: string;
    frequency: string;
    day_of_week: number | null;
    day_of_month: number | null;
    period_length: number;
    period_unit: string;
    recipient_emails: string[];
    is_active: boolean;
    last_run_at: string | null;
    next_run_at: string | null;
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

export default function ScheduledReportsPage() {
    const [schedules, setSchedules] = useState<ScheduledReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);

    useEffect(() => {
        fetchSchedules();
    }, []);

    async function fetchSchedules() {
        try {
            setLoading(true);
            const response = await fetch('/api/scheduled-reports');
            const data = await response.json();

            if (data.success) {
                setSchedules(data.schedules);
            } else {
                setError(data.error || 'Failed to fetch schedules');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h1 className="text-4xl font-bold text-slate-900">Scheduled Reports</h1>
                            <p className="text-slate-600 mt-2">Automate your SEO performance reporting</p>
                        </div>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-lg"
                        >
                            + Create Schedule
                        </button>
                    </div>

                    <Link
                        href="/app/reports"
                        className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                        ← Back to Reports
                    </Link>
                </div>

                {/* Create Form */}
                {showCreateForm && (
                    <CreateScheduleForm
                        onClose={() => setShowCreateForm(false)}
                        onCreated={() => {
                            setShowCreateForm(false);
                            fetchSchedules();
                        }}
                    />
                )}

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        <p className="text-slate-600 mt-4">Loading schedules...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                {/* Schedules Grid */}
                {!loading && !error && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {schedules.length === 0 ? (
                            <div className="col-span-full text-center py-12">
                                <p className="text-slate-600 text-lg">
                                    No scheduled reports yet. Create your first schedule to automate reporting!
                                </p>
                            </div>
                        ) : (
                            schedules.map((schedule) => (
                                <ScheduleCard
                                    key={schedule.id}
                                    schedule={schedule}
                                    onRefresh={fetchSchedules}
                                />
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function ScheduleCard({ schedule, onRefresh }: { schedule: ScheduledReport; onRefresh: () => void }) {
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getFrequencyText = (schedule: ScheduledReport) => {
        switch (schedule.frequency) {
            case 'daily':
                return 'Daily';
            case 'weekly':
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                return `Weekly on ${days[schedule.day_of_week || 0]}`;
            case 'monthly':
                return `Monthly on day ${schedule.day_of_month}`;
            case 'quarterly':
                return 'Quarterly';
            default:
                return schedule.frequency;
        }
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

    async function toggleActive() {
        try {
            setUpdating(true);
            const response = await fetch(`/api/scheduled-reports/${schedule.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !schedule.is_active })
            });

            const data = await response.json();

            if (data.success) {
                onRefresh();
            } else {
                alert(`Failed to update schedule: ${data.error}`);
            }
        } catch (error) {
            console.error('Update error:', error);
            alert('An error occurred while updating');
        } finally {
            setUpdating(false);
        }
    }

    async function handleDelete() {
        if (!confirm('Are you sure you want to delete this schedule?')) {
            return;
        }

        try {
            setDeleting(true);
            const response = await fetch(`/api/scheduled-reports/${schedule.id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                onRefresh();
            } else {
                alert(`Failed to delete schedule: ${data.error}`);
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('An error occurred while deleting');
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow ${!schedule.is_active ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-3xl">{getReportTypeIcon(schedule.report_type)}</span>
                    <div>
                        <h3 className="font-semibold text-slate-900">{schedule.name}</h3>
                        <p className="text-sm text-slate-500">{schedule.website?.client?.name || 'Unknown Client'}</p>
                    </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${schedule.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {schedule.is_active ? 'Active' : 'Paused'}
                </div>
            </div>

            {schedule.description && (
                <p className="text-sm text-slate-600 mb-4">{schedule.description}</p>
            )}

            <div className="space-y-2 mb-4 text-sm">
                <div>
                    <span className="text-slate-600">Website:</span>{' '}
                    <span className="text-slate-900">{schedule.website?.url || 'Unknown'}</span>
                </div>
                <div>
                    <span className="text-slate-600">Frequency:</span>{' '}
                    <span className="text-slate-900">{getFrequencyText(schedule)}</span>
                </div>
                <div>
                    <span className="text-slate-600">Period:</span>{' '}
                    <span className="text-slate-900">
                        Last {schedule.period_length} {schedule.period_unit}
                    </span>
                </div>
                <div>
                    <span className="text-slate-600">Recipients:</span>{' '}
                    <span className="text-slate-900">{schedule.recipient_emails.length} email(s)</span>
                </div>
                <div>
                    <span className="text-slate-600">Last Run:</span>{' '}
                    <span className="text-slate-900">{formatDate(schedule.last_run_at)}</span>
                </div>
                <div>
                    <span className="text-slate-600">Next Run:</span>{' '}
                    <span className="text-slate-900 font-medium">{formatDate(schedule.next_run_at)}</span>
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={toggleActive}
                    disabled={updating}
                    className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${schedule.is_active
                        ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                        } disabled:bg-gray-400 disabled:cursor-not-allowed`}
                >
                    {updating ? 'Updating...' : schedule.is_active ? 'Pause' : 'Resume'}
                </button>
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                    {deleting ? 'Deleting...' : 'Delete'}
                </button>
            </div>
        </div>
    );
}

function CreateScheduleForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [websites, setWebsites] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        websiteId: '',
        reportType: 'email' as 'email' | 'pdf' | 'slide_deck',
        frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'quarterly',
        dayOfWeek: 1,
        dayOfMonth: 1,
        periodLength: 30,
        periodUnit: 'days' as 'days' | 'weeks' | 'months',
        recipientEmails: '',
        includePdfAttachment: false
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

        if (!formData.name || !formData.websiteId || !formData.recipientEmails) {
            alert('Please fill in all required fields');
            return;
        }

        const emails = formData.recipientEmails.split(',').map(e => e.trim()).filter(e => e);
        if (emails.length === 0) {
            alert('Please provide at least one recipient email');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('/api/scheduled-reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    websiteId: formData.websiteId,
                    reportType: formData.reportType,
                    frequency: formData.frequency,
                    dayOfWeek: formData.frequency === 'weekly' ? formData.dayOfWeek : undefined,
                    dayOfMonth: formData.frequency === 'monthly' ? formData.dayOfMonth : undefined,
                    quarterMonth: formData.frequency === 'quarterly' ? 1 : undefined,
                    periodLength: formData.periodLength,
                    periodUnit: formData.periodUnit,
                    recipientEmails: emails,
                    includePdfAttachment: formData.includePdfAttachment
                })
            });

            const data = await response.json();

            if (data.success) {
                alert('Schedule created successfully!');
                onCreated();
            } else {
                alert(`Failed to create schedule: ${data.error}`);
            }
        } catch (error) {
            console.error('Create error:', error);
            alert('An error occurred while creating the schedule');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Create Scheduled Report</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Schedule Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Monthly Performance Report"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            rows={2}
                            placeholder="Optional description"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                                <option value="">Select website</option>
                                {websites.map((website) => (
                                    <option key={website.id} value={website.id}>
                                        {website.url}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Report Type *
                            </label>
                            <select
                                value={formData.reportType}
                                onChange={(e) => setFormData({ ...formData, reportType: e.target.value as any })}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            >
                                <option value="email">Email Report</option>
                                <option value="pdf">PDF Report</option>
                                <option value="slide_deck">Slide Deck</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Frequency *
                            </label>
                            <select
                                value={formData.frequency}
                                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                            </select>
                        </div>

                        {formData.frequency === 'weekly' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Day of Week *
                                </label>
                                <select
                                    value={formData.dayOfWeek}
                                    onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                >
                                    <option value="0">Sunday</option>
                                    <option value="1">Monday</option>
                                    <option value="2">Tuesday</option>
                                    <option value="3">Wednesday</option>
                                    <option value="4">Thursday</option>
                                    <option value="5">Friday</option>
                                    <option value="6">Saturday</option>
                                </select>
                            </div>
                        )}

                        {formData.frequency === 'monthly' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Day of Month *
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={formData.dayOfMonth}
                                    onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Report Period Length *
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={formData.periodLength}
                                onChange={(e) => setFormData({ ...formData, periodLength: parseInt(e.target.value) })}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Period Unit *
                            </label>
                            <select
                                value={formData.periodUnit}
                                onChange={(e) => setFormData({ ...formData, periodUnit: e.target.value as any })}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            >
                                <option value="days">Days</option>
                                <option value="weeks">Weeks</option>
                                <option value="months">Months</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Recipient Emails * (comma-separated)
                        </label>
                        <textarea
                            value={formData.recipientEmails}
                            onChange={(e) => setFormData({ ...formData, recipientEmails: e.target.value })}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            rows={2}
                            placeholder="email1@example.com, email2@example.com"
                            required
                        />
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
                            {loading ? 'Creating...' : 'Create Schedule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
