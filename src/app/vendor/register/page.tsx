'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Store, Mail, Lock, User, Phone, Globe, Palette, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function VendorRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    handle: '',
    business_name: '',
    full_name: '',
    phone: '',
    bio: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  });

  // Handle availability check
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const [checkingHandle, setCheckingHandle] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Reset handle availability when handle changes
    if (name === 'handle') {
      setHandleAvailable(null);
    }
  };

  const checkHandleAvailability = async () => {
    if (!formData.handle) return;

    setCheckingHandle(true);
    try {
      const response = await fetch(`/api/vendor/check-handle?handle=${encodeURIComponent(formData.handle)}`);
      const data = await response.json();
      setHandleAvailable(data.available);
    } catch (err) {
      console.error('Error checking handle:', err);
    } finally {
      setCheckingHandle(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.email || !formData.password || !formData.handle || !formData.business_name) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    // Validate handle format
    const handleRegex = /^[a-z0-9_-]+$/;
    if (!handleRegex.test(formData.handle)) {
      setError('Handle can only contain lowercase letters, numbers, hyphens, and underscores');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/vendor/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          handle: formData.handle.toLowerCase(),
          business_name: formData.business_name,
          full_name: formData.full_name,
          phone: formData.phone,
          bio: formData.bio,
          timezone: formData.timezone
        })
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      setSuccess(true);

      // Redirect to vendor dashboard after 2 seconds
      setTimeout(() => {
        router.push('/vendor/dashboard');
        router.refresh();
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to BlogCanvas!</h2>
          <p className="text-gray-600 mb-4">
            Your vendor account has been created successfully.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting you to your dashboard...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-blue-100 p-3">
              <Store className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Vendor Account</h1>
          <p className="text-gray-600">
            Start building landing pages and managing clients
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Account Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Min. 8 characters"
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>

              <div>
                <Label htmlFor="handle">
                  Vendor Handle *
                  <span className="text-sm text-gray-500 ml-2">
                    (Your URL: blogcanvas.com/@{formData.handle || 'yourhandle'})
                  </span>
                </Label>
                <div className="relative mt-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="handle"
                    name="handle"
                    type="text"
                    placeholder="yourhandle"
                    value={formData.handle}
                    onChange={handleChange}
                    onBlur={checkHandleAvailability}
                    className="pl-10 lowercase"
                    pattern="[a-z0-9_-]+"
                    required
                  />
                  {checkingHandle && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
                    </div>
                  )}
                </div>
                {handleAvailable === false && (
                  <p className="text-sm text-red-600 mt-1">This handle is already taken</p>
                )}
                {handleAvailable === true && (
                  <p className="text-sm text-green-600 mt-1">This handle is available!</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Lowercase letters, numbers, hyphens, and underscores only
                </p>
              </div>

              <div>
                <Label htmlFor="business_name">Business Name *</Label>
                <div className="relative mt-1">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="business_name"
                    name="business_name"
                    type="text"
                    placeholder="Your Business LLC"
                    value={formData.business_name}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  placeholder="Tell us about your business..."
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-6">
              <Button
                type="submit"
                disabled={loading || handleAvailable === false}
                className="w-full"
              >
                {loading ? (
                  <span>Creating Account...</span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Create Vendor Account
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>

              <p className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
