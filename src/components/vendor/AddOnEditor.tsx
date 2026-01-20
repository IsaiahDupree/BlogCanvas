'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, DollarSign, Zap, Clock, Package2, Settings } from 'lucide-react';
import type { OfferAddon, AddonType } from '@/types/offer';

interface AddOnEditorProps {
  offerId: string;
  vendorId: string;
  addons: OfferAddon[];
  onAddAddon: (addon: Partial<OfferAddon>) => void;
  onUpdateAddon: (addonId: string, addon: Partial<OfferAddon>) => void;
  onDeleteAddon: (addonId: string) => void;
}

const ADDON_TYPE_INFO: Record<AddonType, { label: string; icon: any; description: string }> = {
  setup_fee: {
    label: 'Setup Fee',
    icon: Settings,
    description: 'One-time setup or onboarding charge'
  },
  rush_delivery: {
    label: 'Rush Delivery',
    icon: Zap,
    description: 'Expedited delivery timeline'
  },
  extra_revisions: {
    label: 'Extra Revisions',
    icon: Clock,
    description: 'Additional revision rounds'
  },
  retainer_upgrade: {
    label: 'Retainer Upgrade',
    icon: Package2,
    description: 'Upgrade to higher tier retainer'
  },
  custom: {
    label: 'Custom Add-on',
    icon: Plus,
    description: 'Custom service or product add-on'
  }
};

export function AddOnEditor({
  offerId,
  vendorId,
  addons,
  onAddAddon,
  onUpdateAddon,
  onDeleteAddon
}: AddOnEditorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newAddon, setNewAddon] = useState<Partial<OfferAddon>>({
    offer_id: offerId,
    vendor_id: vendorId,
    name: '',
    description: '',
    addon_type: 'custom',
    price: 0,
    currency: 'USD',
    is_active: true
  });

  const handleAddAddon = () => {
    if (newAddon.name && newAddon.price !== undefined) {
      onAddAddon(newAddon);
      setNewAddon({
        offer_id: offerId,
        vendor_id: vendorId,
        name: '',
        description: '',
        addon_type: 'custom',
        price: 0,
        currency: 'USD',
        is_active: true
      });
      setIsAdding(false);
    }
  };

  const updateNewAddonField = (field: keyof OfferAddon, value: any) => {
    setNewAddon(prev => ({ ...prev, [field]: value }));
  };

  const getAddonIcon = (type: AddonType) => {
    const Icon = ADDON_TYPE_INFO[type]?.icon || Plus;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package2 className="h-5 w-5" />
              Add-Ons
            </CardTitle>
            <CardDescription>
              Optional extras customers can purchase
            </CardDescription>
          </div>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Add-On
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Existing Add-ons */}
        {addons.length > 0 ? (
          <div className="space-y-3">
            {addons.map((addon) => (
              <div
                key={addon.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">
                    {getAddonIcon(addon.addon_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{addon.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {ADDON_TYPE_INFO[addon.addon_type]?.label || addon.addon_type}
                      </Badge>
                      {!addon.is_active && (
                        <Badge variant="secondary" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    {addon.description && (
                      <p className="text-sm text-muted-foreground">
                        {addon.description}
                      </p>
                    )}
                    <p className="text-sm font-semibold mt-2">
                      {addon.currency === 'USD' && '$'}
                      {addon.price.toFixed(2)}
                      {addon.currency !== 'USD' && ` ${addon.currency}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={addon.is_active}
                    onCheckedChange={(checked) =>
                      onUpdateAddon(addon.id, { is_active: checked })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteAddon(addon.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !isAdding && (
            <div className="text-center py-8 text-muted-foreground">
              <Package2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No add-ons yet</p>
              <p className="text-sm">Add optional extras to increase your average order value</p>
            </div>
          )
        )}

        {/* Add New Add-on Form */}
        {isAdding && (
          <div className="rounded-lg border p-4 space-y-4 bg-muted/50">
            <h4 className="font-medium">New Add-On</h4>

            <div className="space-y-2">
              <Label htmlFor="addon-type">Add-on Type</Label>
              <Select
                value={newAddon.addon_type}
                onValueChange={(value) => updateNewAddonField('addon_type', value as AddonType)}
              >
                <SelectTrigger id="addon-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ADDON_TYPE_INFO).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        {<info.icon className="h-4 w-4" />}
                        {info.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="addon-name">Name *</Label>
              <Input
                id="addon-name"
                placeholder="e.g., Rush Delivery (48 hours)"
                value={newAddon.name || ''}
                onChange={(e) => updateNewAddonField('name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addon-description">Description</Label>
              <Textarea
                id="addon-description"
                placeholder="What does this add-on include?"
                value={newAddon.description || ''}
                onChange={(e) => updateNewAddonField('description', e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="addon-price">Price *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="addon-price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="pl-9"
                    value={newAddon.price || ''}
                    onChange={(e) => updateNewAddonField('price', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="addon-currency">Currency</Label>
                <Select
                  value={newAddon.currency || 'USD'}
                  onValueChange={(value) => updateNewAddonField('currency', value)}
                >
                  <SelectTrigger id="addon-currency">
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

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAdding(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddAddon}>
                Add Add-On
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
