'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConversionGoal {
  id: string;
  website_id: string;
  name: string;
  description: string | null;
  goal_type: 'event' | 'pageview' | 'custom';
  ga4_event_name: string | null;
  ga4_event_parameters: any;
  target_value: number | null;
  target_count: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ConversionGoalsSettingsProps {
  websiteId: string;
}

export default function ConversionGoalsSettings({ websiteId }: ConversionGoalsSettingsProps) {
  const [goals, setGoals] = useState<ConversionGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    goal_type: 'event' as 'event' | 'pageview' | 'custom',
    ga4_event_name: '',
    target_value: '',
    target_count: '',
    is_active: true,
  });

  const fetchGoals = async () => {
    try {
      const response = await fetch(`/api/conversion-goals?website_id=${websiteId}`);
      if (!response.ok) throw new Error('Failed to fetch goals');

      const data = await response.json();
      setGoals(data.goals || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversion goals',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [websiteId]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      goal_type: 'event',
      ga4_event_name: '',
      target_value: '',
      target_count: '',
      is_active: true,
    });
    setEditingId(null);
    setShowCreateForm(false);
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/conversion-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website_id: websiteId,
          name: formData.name,
          description: formData.description || null,
          goal_type: formData.goal_type,
          ga4_event_name: formData.ga4_event_name || null,
          target_value: formData.target_value ? parseFloat(formData.target_value) : null,
          target_count: formData.target_count ? parseInt(formData.target_count) : null,
          is_active: formData.is_active,
        }),
      });

      if (!response.ok) throw new Error('Failed to create goal');

      toast({
        title: 'Success',
        description: 'Conversion goal created',
      });

      await fetchGoals();
      resetForm();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to create conversion goal',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async (goalId: string) => {
    try {
      const response = await fetch(`/api/conversion-goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          goal_type: formData.goal_type,
          ga4_event_name: formData.ga4_event_name || null,
          target_value: formData.target_value ? parseFloat(formData.target_value) : null,
          target_count: formData.target_count ? parseInt(formData.target_count) : null,
          is_active: formData.is_active,
        }),
      });

      if (!response.ok) throw new Error('Failed to update goal');

      toast({
        title: 'Success',
        description: 'Conversion goal updated',
      });

      await fetchGoals();
      resetForm();
    } catch (error) {
      console.error('Error updating goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to update conversion goal',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this conversion goal?')) return;

    try {
      const response = await fetch(`/api/conversion-goals/${goalId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete goal');

      toast({
        title: 'Success',
        description: 'Conversion goal deleted',
      });

      await fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete conversion goal',
        variant: 'destructive',
      });
    }
  };

  const startEdit = (goal: ConversionGoal) => {
    setFormData({
      name: goal.name,
      description: goal.description || '',
      goal_type: goal.goal_type,
      ga4_event_name: goal.ga4_event_name || '',
      target_value: goal.target_value?.toString() || '',
      target_count: goal.target_count?.toString() || '',
      is_active: goal.is_active,
    });
    setEditingId(goal.id);
    setShowCreateForm(false);
  };

  if (loading) {
    return <div>Loading conversion goals...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Conversion Goals</CardTitle>
          <CardDescription>
            Define conversion goals to track specific user actions via Google Analytics 4
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Existing Goals */}
            {goals.map((goal) => (
              <div
                key={goal.id}
                className={`border rounded-lg p-4 ${editingId === goal.id ? 'border-primary' : ''}`}
              >
                {editingId === goal.id ? (
                  // Edit Form
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Goal Name</Label>
                      <Input
                        id="edit-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Newsletter Signup"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-description">Description (Optional)</Label>
                      <Textarea
                        id="edit-description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Brief description of this goal"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-type">Goal Type</Label>
                        <Select
                          value={formData.goal_type}
                          onValueChange={(value: any) => setFormData({ ...formData, goal_type: value })}
                        >
                          <SelectTrigger id="edit-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="event">Event</SelectItem>
                            <SelectItem value="pageview">Page View</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-event">GA4 Event Name</Label>
                        <Input
                          id="edit-event"
                          value={formData.ga4_event_name}
                          onChange={(e) => setFormData({ ...formData, ga4_event_name: e.target.value })}
                          placeholder="e.g., form_submit"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-value">Target Value ($)</Label>
                        <Input
                          id="edit-value"
                          type="number"
                          step="0.01"
                          value={formData.target_value}
                          onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-count">Target Count</Label>
                        <Input
                          id="edit-count"
                          type="number"
                          value={formData.target_count}
                          onChange={(e) => setFormData({ ...formData, target_count: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <Label>Active</Label>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleUpdate(goal.id)}>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={resetForm}>
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium">{goal.name}</div>
                        {goal.description && (
                          <div className="text-sm text-muted-foreground mt-1">{goal.description}</div>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{goal.goal_type}</Badge>
                          {goal.is_active ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEdit(goal)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(goal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {goal.ga4_event_name && (
                      <div className="text-sm text-muted-foreground mt-2">
                        GA4 Event: <code className="bg-muted px-1 rounded">{goal.ga4_event_name}</code>
                      </div>
                    )}

                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      {goal.target_value && <div>Value: ${goal.target_value}</div>}
                      {goal.target_count && <div>Target: {goal.target_count} conversions</div>}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Create Form */}
            {showCreateForm && (
              <div className="border border-dashed rounded-lg p-4 space-y-4">
                <h3 className="font-medium">New Conversion Goal</h3>

                <div className="space-y-2">
                  <Label htmlFor="create-name">Goal Name *</Label>
                  <Input
                    id="create-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Newsletter Signup"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-description">Description (Optional)</Label>
                  <Textarea
                    id="create-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this goal"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-type">Goal Type *</Label>
                    <Select
                      value={formData.goal_type}
                      onValueChange={(value: any) => setFormData({ ...formData, goal_type: value })}
                    >
                      <SelectTrigger id="create-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="pageview">Page View</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-event">GA4 Event Name</Label>
                    <Input
                      id="create-event"
                      value={formData.ga4_event_name}
                      onChange={(e) => setFormData({ ...formData, ga4_event_name: e.target.value })}
                      placeholder="e.g., form_submit"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-value">Target Value ($)</Label>
                    <Input
                      id="create-value"
                      type="number"
                      step="0.01"
                      value={formData.target_value}
                      onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-count">Target Count</Label>
                    <Input
                      id="create-count"
                      type="number"
                      value={formData.target_count}
                      onChange={(e) => setFormData({ ...formData, target_count: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCreate}>
                    <Save className="h-4 w-4 mr-1" />
                    Create Goal
                  </Button>
                  <Button size="sm" variant="outline" onClick={resetForm}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Add Button */}
            {!showCreateForm && !editingId && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Conversion Goal
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
