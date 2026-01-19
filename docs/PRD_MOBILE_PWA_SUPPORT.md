# PRD: Mobile & PWA Support

**Version:** 1.0  
**Created:** January 19, 2026  
**Status:** Draft  
**Priority:** High  
**Estimated Effort:** 12-16 hours

---

## 1. Executive Summary

Enable Progressive Web App (PWA) capabilities and mobile-first responsive design to provide vendors and clients with a native-like mobile experience. This includes offline support, push notifications, and optimized touch interactions.

---

## 2. Problem Statement

### Current State
- Platform is desktop-first with basic responsive CSS
- No offline capability
- No push notifications for time-sensitive events
- Mobile navigation is suboptimal
- No app install prompt

### Impact
- Vendors managing clients on-the-go have poor experience
- Clients miss important notifications (meetings, deliverables)
- Lower engagement rates on mobile devices
- Competitive disadvantage vs native apps

---

## 3. Goals & Success Metrics

### Goals
1. Achieve PWA Lighthouse score of 90+
2. Enable offline access to key dashboard data
3. Implement push notifications for critical events
4. Redesign navigation for mobile-first experience

### Success Metrics
| Metric | Current | Target |
|--------|---------|--------|
| Mobile Lighthouse Score | ~60 | 90+ |
| Mobile Session Duration | TBD | +25% |
| Mobile Bounce Rate | TBD | -15% |
| Push Notification Opt-in | 0% | 40% |
| App Install Rate | 0% | 15% |

---

## 4. User Stories

### US-PWA-001: App Installation
**As a** vendor  
**I want to** install BlogCanvas as an app on my phone  
**So that** I can quickly access my dashboard without opening a browser

**Acceptance Criteria:**
- [ ] Install prompt appears on eligible devices
- [ ] App icon appears on home screen
- [ ] App launches in standalone mode (no browser chrome)
- [ ] Splash screen shows during load

### US-PWA-002: Offline Dashboard
**As a** vendor  
**I want to** view my dashboard stats even when offline  
**So that** I can check my business metrics anywhere

**Acceptance Criteria:**
- [ ] Last-synced dashboard data available offline
- [ ] Clear indicator when viewing cached data
- [ ] Auto-sync when connection restored
- [ ] Graceful degradation for unavailable features

### US-PWA-003: Push Notifications
**As a** vendor  
**I want to** receive push notifications for new orders and messages  
**So that** I can respond quickly to clients

**Acceptance Criteria:**
- [ ] Notification permission request on first visit
- [ ] Notifications for: new orders, messages, meetings, deliverable approvals
- [ ] Notification preferences in settings
- [ ] Click notification to open relevant page

### US-PWA-004: Mobile Navigation
**As a** user on mobile  
**I want to** easily navigate the platform  
**So that** I can complete tasks efficiently on my phone

**Acceptance Criteria:**
- [ ] Bottom tab navigation for primary actions
- [ ] Swipe gestures for common actions
- [ ] Pull-to-refresh on list views
- [ ] Floating action button for quick create

### US-PWA-005: Client Mobile Portal
**As a** client  
**I want to** approve deliverables and message my vendor from my phone  
**So that** I can manage my projects on the go

**Acceptance Criteria:**
- [ ] Responsive portal layout
- [ ] Touch-friendly approval buttons
- [ ] Mobile-optimized messaging interface
- [ ] Easy file preview and download

---

## 5. Technical Requirements

### 5.1 PWA Manifest
```json
{
  "name": "BlogCanvas",
  "short_name": "BlogCanvas",
  "description": "Vendor Offer Platform",
  "start_url": "/vendor/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 5.2 Service Worker Strategy
| Route | Strategy | TTL |
|-------|----------|-----|
| `/api/vendor/dashboard/stats` | Stale-while-revalidate | 5 min |
| `/api/vendor/clients` | Network-first | - |
| Static assets | Cache-first | 7 days |
| Images | Cache-first | 30 days |

### 5.3 Push Notification Events
| Event | Title | Body |
|-------|-------|------|
| `order.created` | "New Order!" | "{client} purchased {offer}" |
| `message.received` | "New Message" | "{sender}: {preview}" |
| `meeting.reminder` | "Meeting in 15 min" | "{meeting_type} with {client}" |
| `deliverable.approved` | "Deliverable Approved" | "{client} approved {deliverable}" |
| `deliverable.revision` | "Revision Requested" | "{client} requested changes" |

### 5.4 Database Schema

```sql
-- Push notification subscriptions
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  UNIQUE(user_id, endpoint)
);

-- Notification preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL, -- 'push', 'email', 'sms'
  event_type TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  UNIQUE(user_id, channel, event_type)
);
```

### 5.5 API Endpoints

```
POST /api/push/subscribe      - Register push subscription
DELETE /api/push/unsubscribe  - Remove subscription
GET /api/push/vapid-key       - Get public VAPID key
POST /api/push/send           - Send push notification (internal)
GET /api/notifications/preferences  - Get user preferences
PUT /api/notifications/preferences  - Update preferences
```

---

## 6. UI/UX Requirements

### 6.1 Mobile Navigation
```
┌─────────────────────────────┐
│  ≡  BlogCanvas    🔔  👤   │  <- Header (hamburger, logo, notifications, profile)
├─────────────────────────────┤
│                             │
│      [Main Content]         │
│                             │
├─────────────────────────────┤
│  🏠   📄   💬   📊   ⚙️   │  <- Bottom tabs (Home, Pages, Messages, Analytics, Settings)
└─────────────────────────────┘
```

### 6.2 Touch Targets
- Minimum touch target: 44x44px
- Button padding: 12px minimum
- List item height: 56px minimum
- Spacing between interactive elements: 8px minimum

### 6.3 Gestures
| Gesture | Action |
|---------|--------|
| Swipe left on list item | Quick actions (delete, archive) |
| Swipe down on list | Pull to refresh |
| Long press | Context menu |
| Pinch | Zoom on images/charts |

---

## 7. Implementation Plan

### Phase 1: Foundation (4 hours)
- [ ] Create PWA manifest
- [ ] Add service worker with Workbox
- [ ] Implement app install prompt
- [ ] Add splash screens and icons

### Phase 2: Offline Support (4 hours)
- [ ] Configure caching strategies
- [ ] Implement offline indicator
- [ ] Cache dashboard stats
- [ ] Handle offline form submissions (queue)

### Phase 3: Push Notifications (4 hours)
- [ ] Set up Web Push (VAPID keys)
- [ ] Create subscription API
- [ ] Add notification preferences UI
- [ ] Integrate with existing event system

### Phase 4: Mobile UX (4 hours)
- [ ] Implement bottom navigation
- [ ] Add pull-to-refresh
- [ ] Optimize touch targets
- [ ] Add swipe gestures

---

## 8. Dependencies

| Dependency | Purpose |
|------------|---------|
| `next-pwa` or `@serwist/next` | PWA plugin for Next.js |
| `web-push` | Server-side push notifications |
| `idb` | IndexedDB wrapper for offline storage |

---

## 9. Environment Variables

```bash
# Web Push VAPID Keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_SUBJECT=mailto:support@blogcanvas.com
```

---

## 10. Testing Requirements

| Test Type | Coverage |
|-----------|----------|
| PWA Lighthouse Audit | Score 90+ |
| Offline functionality | Core dashboard accessible |
| Push notification delivery | 99%+ delivery rate |
| Mobile usability | All user flows completable |
| Cross-device testing | iOS Safari, Chrome Android, Samsung Internet |

---

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| iOS PWA limitations | Medium | Document limitations, prioritize web features |
| Push notification blocking | Medium | Explain value before requesting permission |
| Service worker caching bugs | High | Implement cache versioning and purge strategy |

---

## 12. Future Enhancements

- [ ] Background sync for offline actions
- [ ] Periodic background fetch for stats
- [ ] Native share integration
- [ ] Badging API for unread counts
- [ ] Shortcuts for quick actions

---

*Document Owner: Engineering*  
*Last Updated: January 19, 2026*
