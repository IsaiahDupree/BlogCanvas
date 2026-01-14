'use client'

import { useState } from 'react'
import { Bell, Check, Mail, FileText, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Notification {
  id: string
  type: 'post' | 'batch' | 'message' | 'system'
  title: string
  message: string
  read: boolean
  created_at: string
}

export default function PortalNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const getIcon = (type: string) => {
    switch (type) {
      case 'post': return <FileText className="w-5 h-5 text-blue-500" />
      case 'batch': return <Mail className="w-5 h-5 text-green-500" />
      case 'message': return <MessageSquare className="w-5 h-5 text-purple-500" />
      default: return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-2">Stay updated on your content progress</p>
        </div>
        {notifications.some(n => !n.read) && (
          <Button variant="outline" onClick={markAllRead}>
            <Check className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No notifications</h3>
            <p className="text-gray-500 mt-2">You're all caught up!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`${notification.read ? 'opacity-60' : ''}`}
            >
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  {getIcon(notification.type)}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{notification.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
