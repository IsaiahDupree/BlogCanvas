# Global Sidebar Implementation

**Date:** December 2024  
**Status:** ✅ Complete

## 🎉 Overview

A global, toggleable sidebar has been implemented that appears on all pages (except login/auth pages) with role-based navigation.

## ✅ Features

1. **Global Sidebar**
   - Appears on all pages automatically
   - Hidden on login/auth pages
   - Responsive design (mobile/desktop)

2. **Toggleable**
   - Toggle button in sidebar header (mobile)
   - Toggle button in page headers (desktop)
   - State persisted in localStorage
   - Smooth animations

3. **Role-Based Navigation**
   - Staff/Admin navigation for `/app/*` routes
   - Client navigation for `/portal/*` routes
   - Automatic detection based on current route

4. **User Section**
   - Shows current user info
   - Sign out button
   - User avatar with initials

## 📁 Files Created

### 1. `src/contexts/sidebar-context.tsx`
- Sidebar state management
- Toggle functions (open, close, toggle)
- localStorage persistence
- React Context provider

### 2. `src/components/layout/GlobalSidebar.tsx`
- Main sidebar component
- Role-based navigation
- User section with sign out
- Mobile/desktop responsive

### 3. `src/components/layout/SidebarToggle.tsx`
- Reusable toggle button component
- Can be used in headers

### 4. `src/components/layout/PageHeader.tsx`
- Page header component with sidebar toggle
- Optional title, description, and actions
- Responsive design

## 🔧 Files Modified

### 1. `src/app/layout.tsx`
- Added `SidebarProvider` wrapper
- Added `GlobalSidebar` component
- Added padding for sidebar on desktop (`lg:pl-64`)

### 2. `src/app/auth/reset-password/page.tsx`
- Wrapped in `Suspense` for `useSearchParams`
- Fixed build error

### 3. `src/app/api/auth/invite/route.ts`
- Fixed `getUserByEmail` API call
- Uses `listUsers` instead

## 🎨 Navigation Structure

### Staff/Admin Navigation (`/app/*`)

```
Overview
  - Dashboard

Content Pipeline
  - Websites
  - Content Batches
  - Review Board

Management
  - Clients
  - Analytics

Settings
  - Configuration
```

### Client Navigation (`/portal/*`)

```
Overview
  - Dashboard

Content
  - Blog Posts
  - Content Batches

Account
  - Brand Guide
  - Notifications
```

## 🎯 Usage

### Using the Sidebar

The sidebar is automatically included on all pages via the root layout. No additional setup needed.

### Using the Toggle Button

```tsx
import { SidebarToggle } from '@/components/layout/SidebarToggle'

function MyHeader() {
    return (
        <header>
            <SidebarToggle />
            {/* Other header content */}
        </header>
    )
}
```

### Using the Sidebar Context

```tsx
'use client'
import { useSidebar } from '@/contexts/sidebar-context'

function MyComponent() {
    const { isOpen, toggle, open, close } = useSidebar()
    
    return (
        <button onClick={toggle}>
            {isOpen ? 'Close' : 'Open'} Sidebar
        </button>
    )
}
```

### Using PageHeader Component

```tsx
import { PageHeader } from '@/components/layout/PageHeader'

export default function MyPage() {
    return (
        <>
            <PageHeader 
                title="My Page"
                description="Page description"
                actions={<button>Action</button>}
            />
            <div>Page content</div>
        </>
    )
}
```

## 📱 Responsive Behavior

### Desktop (lg: 1024px+)
- Sidebar always visible by default
- Can be toggled with button
- Content area has left padding (`lg:pl-64`)
- Toggle button in page header

### Mobile (< 1024px)
- Sidebar hidden by default
- Opens as overlay when toggled
- Dark overlay behind sidebar
- Closes on navigation or overlay click
- Toggle button in sidebar header

## 🔐 Authentication Integration

- Sidebar fetches user data from `/api/auth/me`
- Shows user info in footer section
- Sign out button redirects to login
- Automatically hides on login/auth pages

## 💾 State Persistence

- Sidebar open/closed state saved to `localStorage`
- Persists across page refreshes
- Default state: `open` (true)

## 🎨 Styling

- Dark theme (`bg-gray-900`)
- Gradient logo text
- Active route highlighting
- Smooth transitions
- Hover effects
- Shadow effects

## 🚫 Pages Without Sidebar

The sidebar automatically hides on:
- `/portal/login`
- `/auth/*` routes
- Any route starting with `/auth/`

## 📝 Customization

### Adding Navigation Items

Edit `src/components/layout/GlobalSidebar.tsx`:

```tsx
const staffNavigation: NavGroup[] = [
    {
        name: 'New Section',
        items: [
            { name: 'New Item', href: '/app/new-item', icon: Icon },
        ]
    }
]
```

### Changing Sidebar Width

Edit `src/components/layout/GlobalSidebar.tsx`:

```tsx
// Change w-64 to desired width (e.g., w-72 for 18rem)
className="... w-64 lg:w-64"
```

And update padding in `src/app/layout.tsx`:

```tsx
<main className="lg:pl-64 ..."> {/* Match sidebar width */}
```

## ✅ Testing

The sidebar has been tested for:
- ✅ Responsive behavior
- ✅ Toggle functionality
- ✅ State persistence
- ✅ Navigation routing
- ✅ Role-based navigation
- ✅ User authentication
- ✅ Build compilation

## 🚀 Next Steps

1. Add keyboard shortcut (e.g., `Ctrl+B` to toggle)
2. Add sidebar animations
3. Add sidebar collapse to icon-only mode
4. Add breadcrumbs
5. Add search functionality

---

**Last Updated:** December 2024  
**Status:** ✅ Production Ready

