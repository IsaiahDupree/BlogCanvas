'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, CheckCircle2, AlertCircle, ExternalLink, ArrowRight } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface ConnectStatus {
  connected: boolean;
  requiresOnboarding?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
  requiresAction?: boolean;
  email?: string;
  country?: string;
  dashboardUrl?: string;
}

export default function PaymentsSettingsPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get vendor ID (you'll need to implement this based on your auth)
  const vendorId = 'YOUR_VENDOR_ID'; // TODO: Get from auth context

  useEffect(() => {
    // Check for success/refresh params
    if (searchParams.get('success') === 'true') {
      setSuccess('Stripe account successfully connected!');
    }
    if (searchParams.get('refresh') === 'true') {
      setError('There was an issue connecting your account. Please try again.');
    }

    fetchConnectStatus();
  }, [searchParams]);

  const fetchConnectStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stripe/connect?vendorId=${vendorId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch status');
      }

      setStatus(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setProcessing(true);
      setError(null);

      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create onboarding link');
      }

      // Redirect to Stripe onboarding
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setProcessing(false);
    }
  };

  const handleDashboard = async () => {
    try {
      setProcessing(true);
      const response = await fetch(`/api/stripe/connect?vendorId=${vendorId}&action=dashboard`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get dashboard link');
      }

      // Open Stripe dashboard in new tab
      window.open(data.dashboardUrl, '_blank');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Payment Settings</h1>
          <p className="text-muted-foreground">Manage your Stripe Connect account for receiving payments</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Payment Settings</h1>
        <p className="text-muted-foreground">Manage your Stripe Connect account for receiving payments</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <div className="ml-2 text-green-800">{success}</div>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-500 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <div className="ml-2 text-red-800">{error}</div>
        </Alert>
      )}

      {/* Stripe Connect Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Stripe Connect
          </CardTitle>
          <CardDescription>
            Connect your Stripe account to accept payments from customers
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {status?.connected ? (
            <>
              {/* Connected Status */}
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-100">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Stripe Connected</p>
                    {status.email && (
                      <p className="text-sm text-muted-foreground">{status.email}</p>
                    )}
                  </div>
                </div>
                <Badge variant={status.chargesEnabled ? 'default' : 'secondary'}>
                  {status.chargesEnabled ? 'Active' : 'Setup Required'}
                </Badge>
              </div>

              {/* Account Capabilities */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Account Status</h4>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Charges Enabled</span>
                    <span className={status.chargesEnabled ? 'text-green-600' : 'text-yellow-600'}>
                      {status.chargesEnabled ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Payouts Enabled</span>
                    <span className={status.payoutsEnabled ? 'text-green-600' : 'text-yellow-600'}>
                      {status.payoutsEnabled ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Details Submitted</span>
                    <span className={status.detailsSubmitted ? 'text-green-600' : 'text-yellow-600'}>
                      {status.detailsSubmitted ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Required Alert */}
              {status.requiresAction && (
                <Alert className="border-yellow-500 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <div className="ml-2 text-yellow-800">
                    Action required: Please complete your Stripe account setup to start accepting payments.
                  </div>
                </Alert>
              )}
            </>
          ) : (
            /* Not Connected */
            <div className="text-center py-8">
              <div className="p-4 rounded-full bg-muted w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Connect Your Stripe Account</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                To start accepting payments, you need to connect your Stripe account. This secure process takes just a few minutes.
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          {status?.connected ? (
            <>
              {status.requiresAction && (
                <Button onClick={handleConnect} disabled={processing}>
                  {processing ? 'Loading...' : 'Complete Setup'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleDashboard}
                disabled={processing}
                className="ml-auto"
              >
                Open Stripe Dashboard
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button onClick={handleConnect} disabled={processing} className="mx-auto">
              {processing ? 'Connecting...' : 'Connect with Stripe'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>About Stripe Connect</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            Stripe Connect allows you to accept payments directly from your customers. Here's what you need to know:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
            <li>Secure payment processing powered by Stripe</li>
            <li>Accept credit cards, debit cards, and more</li>
            <li>Automated payouts to your bank account</li>
            <li>Full transaction history and reporting</li>
            <li>Industry-standard security and compliance</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
