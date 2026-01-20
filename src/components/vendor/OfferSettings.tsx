'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, DollarSign, Clock, Package } from 'lucide-react';
import type { Offer, OfferType, BillingPeriod } from '@/types/offer';

interface OfferSettingsProps {
  pageId: string;
  vendorId: string;
  existingOffer?: Offer;
  onSave: (offer: Partial<Offer>) => void;
  onCancel?: () => void;
}

export function OfferSettings({
  pageId,
  vendorId,
  existingOffer,
  onSave,
  onCancel
}: OfferSettingsProps) {
  const [offer, setOffer] = useState<Partial<Offer>>(existingOffer || {
    page_id: pageId,
    vendor_id: vendorId,
    name: '',
    description: '',
    offer_type: 'one_time',
    base_price: 0,
    currency: 'USD',
    billing_period: undefined,
    is_quote_mode: false,
    is_active: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(offer);
  };

  const updateField = (field: keyof Offer, value: any) => {
    setOffer(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          {existingOffer ? 'Edit Offer' : 'Create Offer'}
        </CardTitle>
        <CardDescription>
          Configure your offer pricing and checkout options
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Offer Name */}
          <div className="space-y-2">
            <Label htmlFor="offer-name">Offer Name *</Label>
            <Input
              id="offer-name"
              placeholder="e.g., Premium SEO Audit"
              value={offer.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="offer-description">Description</Label>
            <Textarea
              id="offer-description"
              placeholder="Brief description of what's included..."
              value={offer.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Offer Type */}
          <div className="space-y-2">
            <Label htmlFor="offer-type">Offer Type *</Label>
            <Select
              value={offer.offer_type}
              onValueChange={(value) => updateField('offer_type', value as OfferType)}
            >
              <SelectTrigger id="offer-type">
                <SelectValue placeholder="Select offer type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one_time">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    One-time Purchase
                  </div>
                </SelectItem>
                <SelectItem value="subscription">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Subscription
                  </div>
                </SelectItem>
                <SelectItem value="retainer">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Retainer
                  </div>
                </SelectItem>
                <SelectItem value="book_call">Book a Call</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Base Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="base-price">
                {offer.offer_type === 'book_call' ? 'Deposit Amount (optional)' : 'Base Price *'}
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="base-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="pl-9"
                  value={offer.base_price || ''}
                  onChange={(e) => updateField('base_price', parseFloat(e.target.value) || 0)}
                  required={offer.offer_type !== 'book_call'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={offer.currency || 'USD'}
                onValueChange={(value) => updateField('currency', value)}
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="CAD">CAD (C$)</SelectItem>
                  <SelectItem value="AUD">AUD (A$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Billing Period (for subscriptions/retainers) */}
          {(offer.offer_type === 'subscription' || offer.offer_type === 'retainer') && (
            <div className="space-y-2">
              <Label htmlFor="billing-period">Billing Period *</Label>
              <Select
                value={offer.billing_period}
                onValueChange={(value) => updateField('billing_period', value as BillingPeriod)}
              >
                <SelectTrigger id="billing-period">
                  <SelectValue placeholder="Select billing period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Quote Mode Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="quote-mode" className="text-base cursor-pointer">
                Quote Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable to capture leads instead of accepting payments
              </p>
            </div>
            <Switch
              id="quote-mode"
              checked={offer.is_quote_mode || false}
              onCheckedChange={(checked) => updateField('is_quote_mode', checked)}
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="is-active" className="text-base cursor-pointer">
                Active
              </Label>
              <p className="text-sm text-muted-foreground">
                Make this offer available for purchase
              </p>
            </div>
            <Switch
              id="is-active"
              checked={offer.is_active !== false}
              onCheckedChange={(checked) => updateField('is_active', checked)}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" className="ml-auto">
            {existingOffer ? 'Update Offer' : 'Create Offer'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
