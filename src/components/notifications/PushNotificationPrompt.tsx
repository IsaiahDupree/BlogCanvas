'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, X } from 'lucide-react'

/**
 * PushNotificationPrompt Component
 *
 * Prompts users to enable push notifications and handles subscription
 */
export function PushNotificationPrompt() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check if push notifications are supported
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)

      // Check if user is already subscribed
      checkSubscription()

      // Show prompt after 5 seconds if not already subscribed or denied
      const timer = setTimeout(() => {
        if (Notification.permission === 'default' && !isSubscribed) {
          setShowPrompt(true)
        }
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [isSubscribed])

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    } catch (error) {
      console.error('Error checking subscription:', error)
    }
  }

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const subscribeToPush = async () => {
    setIsLoading(true)

    try {
      // Request notification permission
      const permission = await Notification.requestPermission()
      setPermission(permission)

      if (permission !== 'granted') {
        setShowPrompt(false)
        setIsLoading(false)
        return
      }

      // Get VAPID public key
      const response = await fetch('/api/push/vapid-key')
      const { publicKey } = await response.json()

      if (!publicKey) {
        throw new Error('VAPID public key not available')
      }

      // Subscribe to push notifications
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      // Send subscription to server
      const subscribeResponse = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          deviceInfo: {
            browser: navigator.userAgent,
            os: navigator.platform,
            device: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
          },
        }),
      })

      if (!subscribeResponse.ok) {
        throw new Error('Failed to save subscription')
      }

      setIsSubscribed(true)
      setShowPrompt(false)
    } catch (error) {
      console.error('Error subscribing to push:', error)
      alert('Failed to enable push notifications. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribeFromPush = async () => {
    setIsLoading(true)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Unsubscribe on server
        await fetch('/api/push/unsubscribe', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        })

        // Unsubscribe locally
        await subscription.unsubscribe()
        setIsSubscribed(false)
      }
    } catch (error) {
      console.error('Error unsubscribing from push:', error)
      alert('Failed to disable push notifications. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isSupported) {
    return null
  }

  // Floating notification prompt
  if (showPrompt && permission === 'default') {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <button
          onClick={() => setShowPrompt(false)}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>

          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Stay Updated
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Enable notifications to get instant updates on new orders, messages, and meetings.
            </p>

            <div className="flex gap-2">
              <button
                onClick={subscribeToPush}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Enabling...' : 'Enable Notifications'}
              </button>
              <button
                onClick={() => setShowPrompt(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Settings toggle (can be placed in settings page)
  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3">
        {isSubscribed ? (
          <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        ) : (
          <BellOff className="w-5 h-5 text-gray-400" />
        )}
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Push Notifications
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isSubscribed
              ? 'You will receive push notifications'
              : permission === 'denied'
              ? 'Notifications are blocked in your browser'
              : 'Enable to receive instant updates'}
          </p>
        </div>
      </div>

      {permission !== 'denied' && (
        <button
          onClick={isSubscribed ? unsubscribeFromPush : subscribeToPush}
          disabled={isLoading}
          className={`px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${
            isSubscribed
              ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
              : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
          }`}
        >
          {isLoading ? 'Loading...' : isSubscribed ? 'Disable' : 'Enable'}
        </button>
      )}
    </div>
  )
}
