# PRD: Client Content Requests & Account Settings

**Feature ID:** FEAT-052  
**Version:** 1.0  
**Date:** January 14, 2026  
**Status:** In Development

---

## 1. Executive Summary

This feature enables clients to request new content (blogs/batches) directly from their portal, with requests routed to their assigned vendor. Additionally, it provides clients with comprehensive account settings including profile management, plan information, and logout functionality.

---

## 2. Features Overview

### 2.1 Client Content Request System
- **Request Button**: Prominent button in client portal header
- **Request Form**: Modal/page with auto-filled client info
- **Request Fields**: Content type, message, optional attachments
- **Vendor Routing**: Requests sent to client's assigned vendor
- **Notifications**: Vendor notified of new requests

### 2.2 Vendor Requests Dashboard
- **New Sidebar Tab**: "Requests" in vendor navigation
- **Request List**: View all incoming client requests
- **Request Management**: Accept, respond, mark complete

### 2.3 Client Account Settings
- **Profile Photo**: Upload/change profile picture
- **Account Details**: Update name, email, password
- **Plan Information**: View current subscription plan
- **Logout**: Sign out functionality

---

## 3. Database Schema

### 3.1 New Table: content_requests

```sql
CREATE TABLE content_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id),
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    requested_by UUID NOT NULL REFERENCES profiles(id),
    
    -- Request Details
    content_type VARCHAR(50) NOT NULL, -- 'blog_post', 'batch', 'newsletter', 'other'
    title VARCHAR(255),
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'declined'
    
    -- Response
    vendor_response TEXT,
    responded_at TIMESTAMPTZ,
    responded_by UUID REFERENCES profiles(id),
    
    -- Attachments (stored as JSON array of file URLs)
    attachments JSONB DEFAULT '[]',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_content_requests_client ON content_requests(client_id);
CREATE INDEX idx_content_requests_vendor ON content_requests(vendor_id);
CREATE INDEX idx_content_requests_status ON content_requests(status);
```

### 3.2 Update profiles Table

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
```

---

## 4. API Endpoints

### 4.1 Content Requests

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/content-requests` | Create new content request |
| GET | `/api/content-requests` | List requests (filtered by role) |
| GET | `/api/content-requests/[id]` | Get single request |
| PATCH | `/api/content-requests/[id]` | Update request status/response |

### 4.2 Client Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/portal/profile` | Get client profile |
| PATCH | `/api/portal/profile` | Update profile (name, email) |
| POST | `/api/portal/profile/avatar` | Upload profile photo |
| POST | `/api/portal/profile/password` | Change password |

---

## 5. UI Components

### 5.1 Client Portal Header Button

```
+--------------------------------------------------+
| Welcome back!                    [📝 Request Content] [🔔] [All Posts] |
| Acme Software Inc                                 |
+--------------------------------------------------+
```

### 5.2 Content Request Modal/Form

```
+------------------------------------------+
| Request New Content                       |
+------------------------------------------+
| Name: [John Doe] (auto-filled, readonly) |
| Email: [john@acme.com] (auto-filled)     |
|                                          |
| Content Type: [Dropdown]                 |
|   - Blog Post                            |
|   - Content Batch                        |
|   - Newsletter                           |
|   - Other                                |
|                                          |
| Priority: [Normal ▼]                     |
|                                          |
| Message: *                               |
| [                                    ]   |
| [  Describe what you need...         ]   |
| [                                    ]   |
|                                          |
| Attachments (optional):                  |
| [📎 Upload Files]                        |
|                                          |
| [Cancel]              [Submit Request]   |
+------------------------------------------+
```

### 5.3 Vendor Requests Page

```
+------------------------------------------+
| Content Requests                          |
| Manage incoming client requests           |
+------------------------------------------+
| [All] [Pending] [In Progress] [Completed] |
+------------------------------------------+
| 🟡 Blog Post Request                      |
|    From: Acme Software Inc                |
|    "Need a blog about AI trends..."       |
|    Submitted: 2 hours ago                 |
|                        [View] [Respond]   |
+------------------------------------------+
```

### 5.4 Client Settings Page

```
+------------------------------------------+
| Account Settings                          |
+------------------------------------------+
| Profile Photo                             |
| [👤 Avatar]  [Change Photo]              |
|                                          |
| Personal Information                      |
| Name: [John Doe        ]                 |
| Email: [john@acme.com  ]                 |
|                                          |
| Password                                  |
| [Change Password →]                       |
|                                          |
+------------------------------------------+
| Plan Information                          |
+------------------------------------------+
| Current Plan: Professional                |
| Posts/Month: 10                           |
| Renewal: Jan 1, 2026                      |
|                                          |
+------------------------------------------+
| [Log Out]                                 |
+------------------------------------------+
```

---

## 6. User Flows

### 6.1 Client Submits Content Request

1. Client clicks "Request Content" button
2. Modal opens with pre-filled name/email
3. Client selects content type
4. Client writes message describing needs
5. Client optionally attaches reference files
6. Client submits request
7. Request saved to database
8. Notification sent to vendor
9. Confirmation shown to client

### 6.2 Vendor Handles Request

1. Vendor sees notification or visits Requests page
2. Vendor views request details
3. Vendor responds/accepts request
4. Vendor marks as in-progress
5. Vendor creates content
6. Vendor marks as completed
7. Client notified of completion

---

## 7. Implementation Plan

### Phase 1: Database & API
- [ ] Create content_requests migration
- [ ] Add avatar_url to profiles
- [ ] Create content requests API endpoints
- [ ] Create profile update API endpoints

### Phase 2: Client Portal
- [ ] Add "Request Content" button to header
- [ ] Create request form modal
- [ ] Implement file upload for attachments
- [ ] Create client settings page
- [ ] Add profile photo upload
- [ ] Add logout functionality

### Phase 3: Vendor Dashboard
- [ ] Add "Requests" to sidebar navigation
- [ ] Create requests list page
- [ ] Create request detail/response view
- [ ] Add status management

### Phase 4: Notifications
- [ ] Notify vendor on new request
- [ ] Notify client on status updates

---

## 8. Security Considerations

- Clients can only see their own requests
- Vendors can only see requests from their clients
- File uploads validated for type and size
- Password changes require current password
- Email changes should send verification

---

## 9. Success Metrics

- Clients can submit content requests
- Vendors receive and respond to requests
- Clients can update their profile
- All data properly scoped by tenant
