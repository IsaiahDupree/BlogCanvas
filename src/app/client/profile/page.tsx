'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Mail, Phone, Building, User as UserIcon, MapPin, Globe } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AvatarUpload } from '@/components/AvatarUpload'

export default function ClientProfilePage() {
  const [isSaving, setIsSaving] = useState(false)
  const [profileData, setProfileData] = useState({
    firstName: 'John',
    lastName: 'Smith',
    email: 'john@acmesoftware.com',
    phone: '+1 (555) 123-4567',
    company: 'Acme Software Inc',
    jobTitle: 'Marketing Director',
    address: '123 Main Street',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94105',
    country: 'United States',
    website: 'https://acmesoftware.com',
    timezone: 'America/Los_Angeles'
  })

  const handleChange = (field: string, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    // Show success message
  }

  const handleUploadSuccess = (avatarUrl: string) => {
    setUploadMessage({ type: 'success', text: 'Avatar updated successfully!' })
    setTimeout(() => setUploadMessage(null), 3000)
  }

  const handleUploadError = (error: string) => {
    setUploadMessage({ type: 'error', text: error })
    setTimeout(() => setUploadMessage(null), 5000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/client/dashboard"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-muted-foreground mt-1">Manage your personal information</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Upload message */}
        {uploadMessage && (
          <div className={`mb-4 p-4 rounded-lg ${uploadMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {uploadMessage.text}
          </div>
        )}

        {/* Profile Photo */}
        <Card className="p-6 bg-white shadow-xl mb-6">
          <h2 className="text-xl font-bold mb-4">Profile Photo</h2>
          <AvatarUpload
            userName={`${profileData.firstName} ${profileData.lastName}`}
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </Card>

        {/* Personal Information */}
        <Card className="p-6 bg-white shadow-xl mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-indigo-600" />
            Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={profileData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={profileData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Changing your email requires verification
              </p>
            </div>
            <div>
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={profileData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                value={profileData.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Company Information */}
        <Card className="p-6 bg-white shadow-xl mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Building className="w-5 h-5 text-indigo-600" />
            Company Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                value={profileData.company}
                onChange={(e) => handleChange('company', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={profileData.jobTitle}
                onChange={(e) => handleChange('jobTitle', e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="website" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Company Website
              </Label>
              <Input
                id="website"
                type="url"
                value={profileData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </Card>

        {/* Address */}
        <Card className="p-6 bg-white shadow-xl mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-600" />
            Address
          </h2>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={profileData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={profileData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={profileData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                <Input
                  id="zipCode"
                  value={profileData.zipCode}
                  onChange={(e) => handleChange('zipCode', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={profileData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex items-center justify-between">
          <Link
            href="/client/dashboard"
            className="text-muted-foreground hover:text-gray-900 transition-colors"
          >
            Cancel
          </Link>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
