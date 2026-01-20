'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  Video,
  Phone,
  MapPin,
  DollarSign,
  Copy,
  ExternalLink,
  X
} from 'lucide-react';

interface MeetingType {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  location_type: string;
  location_details?: string;
  is_paid: boolean;
  price: number;
  currency: string;
  is_active: boolean;
  color?: string;
}

export default function VendorMeetingTypesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vendorHandle, setVendorHandle] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 30,
    buffer_after_minutes: 15,
    location_type: 'google_meet',
    is_paid: false,
    price: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get vendor profile for handle
      const profileRes = await fetch('/api/vendor/profile');
      const profileData = await profileRes.json();
      if (profileData.success) {
        setVendorHandle(profileData.vendor.handle);
      }

      // Get meeting types
      const response = await fetch('/api/vendor/meeting-types');
      const data = await response.json();

      if (data.success) {
        setMeetingTypes(data.meetingTypes || []);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading meeting types:', error);
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/vendor/meeting-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setMeetingTypes([data.meetingType, ...meetingTypes]);
        setShowCreateModal(false);
        setFormData({
          name: '',
          description: '',
          duration_minutes: 30,
          buffer_after_minutes: 15,
          location_type: 'google_meet',
          is_paid: false,
          price: 0
        });
      } else {
        alert('Error creating meeting type: ' + data.error);
      }

      setSaving(false);
    } catch (error) {
      console.error('Error creating meeting type:', error);
      alert('Error creating meeting type');
      setSaving(false);
    }
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'google_meet':
      case 'zoom':
        return <Video className="h-4 w-4" />;
      case 'phone':
        return <Phone className="h-4 w-4" />;
      case 'in_person':
        return <MapPin className="h-4 w-4" />;
      default:
        return <Video className="h-4 w-4" />;
    }
  };

  const getLocationLabel = (type: string) => {
    switch (type) {
      case 'google_meet':
        return 'Google Meet';
      case 'zoom':
        return 'Zoom';
      case 'phone':
        return 'Phone Call';
      case 'in_person':
        return 'In Person';
      default:
        return type;
    }
  };

  const copyBookingLink = (meetingTypeId: string) => {
    // Use @handle format for public booking URLs - middleware will rewrite to /handle
    const link = `${window.location.origin}/@${vendorHandle}/book/${meetingTypeId}`;
    navigator.clipboard.writeText(link);
    alert('Booking link copied to clipboard!');
  };

  const openBookingPage = (meetingTypeId: string) => {
    // Open the direct path (without @) since that's where the page actually lives
    window.open(`/${vendorHandle}/book/${meetingTypeId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meeting Types</h1>
          <p className="text-gray-600 mt-1">
            Create different types of meetings clients can book with you
          </p>
        </div>

        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Meeting Type
        </Button>
      </div>

      {/* Meeting Types Grid */}
      {meetingTypes.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Meeting Types Yet</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            Create your first meeting type to allow clients to book calls with you.
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Meeting Type
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetingTypes.map((type) => (
            <Card key={type.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-3 h-12 rounded-full"
                  style={{ backgroundColor: type.color || '#3B82F6' }}
                />
                <Badge variant={type.is_active ? 'default' : 'secondary'}>
                  {type.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">{type.name}</h3>
              
              {type.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{type.description}</p>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{type.duration_minutes} minutes</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {getLocationIcon(type.location_type)}
                  <span>{getLocationLabel(type.location_type)}</span>
                </div>
                {type.is_paid && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <DollarSign className="h-4 w-4" />
                    <span>${type.price} {type.currency}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyBookingLink(type.id)}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openBookingPage(type.id)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">New Meeting Type</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="name">Meeting Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Discovery Call, Strategy Session"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What will you discuss in this meeting?"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duration (minutes) *</Label>
                  <select
                    id="duration"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="location">Location *</Label>
                  <select
                    id="location"
                    value={formData.location_type}
                    onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="google_meet">Google Meet</option>
                    <option value="zoom">Zoom</option>
                    <option value="phone">Phone Call</option>
                    <option value="in_person">In Person</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_paid}
                    onChange={(e) => setFormData({ ...formData, is_paid: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Paid meeting</span>
                </label>

                {formData.is_paid && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">$</span>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      className="w-24"
                      min={0}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !formData.name}
                  className="flex-1"
                >
                  {saving ? 'Creating...' : 'Create Meeting Type'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
