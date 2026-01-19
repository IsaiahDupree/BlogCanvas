# PRD: White-Label & Custom Domain Support

**Version:** 1.0  
**Created:** January 19, 2026  
**Status:** Draft  
**Priority:** High  
**Estimated Effort:** 16-20 hours

---

## 1. Executive Summary

Enable vendors to use their own custom domains for client portals and offer pages, providing a fully white-labeled experience. This includes automatic SSL provisioning, DNS verification, and custom branding per domain.

---

## 2. Problem Statement

### Current State
- All vendor pages served from `blogcanvas.com/@vendor/`
- Client portals at `blogcanvas.com/client-portal/`
- BlogCanvas branding visible throughout
- Vendors cannot fully brand the experience

### Impact
- Reduces vendor credibility with clients
- Limits adoption by agencies wanting branded solutions
- Lost revenue opportunity (premium feature)
- Competitive disadvantage vs white-label competitors

---

## 3. Goals & Success Metrics

### Goals
1. Allow vendors to map custom domains to their portals
2. Automatic SSL certificate provisioning
3. Custom branding per domain (logo, colors, favicon)
4. Email sending from custom domains

### Success Metrics
| Metric | Target |
|--------|--------|
| Custom domain setup success rate | 95% |
| SSL provisioning time | < 5 minutes |
| DNS verification success | 90% first attempt |
| Premium tier adoption | 20% of vendors |

---

## 4. User Stories

### US-WL-001: Add Custom Domain
**As a** vendor  
**I want to** add my own domain for my client portal  
**So that** clients see my brand, not BlogCanvas

**Acceptance Criteria:**
- [ ] Input domain in vendor settings
- [ ] Show DNS records to configure
- [ ] Verify DNS configuration
- [ ] Auto-provision SSL certificate
- [ ] Activate domain when ready

### US-WL-002: DNS Verification
**As a** vendor  
**I want to** verify I own the domain  
**So that** only I can use it on BlogCanvas

**Acceptance Criteria:**
- [ ] Display required DNS records (CNAME/TXT)
- [ ] "Verify" button to check configuration
- [ ] Clear error messages for misconfigurations
- [ ] Email notification when verified

### US-WL-003: Custom Branding per Domain
**As a** vendor  
**I want to** set custom branding for my domain  
**So that** clients see a fully branded experience

**Acceptance Criteria:**
- [ ] Upload custom logo
- [ ] Set brand colors
- [ ] Custom favicon
- [ ] Custom email footer
- [ ] Hide "Powered by BlogCanvas" option

### US-WL-004: Client Portal on Custom Domain
**As a** client  
**I want to** access my portal at my vendor's domain  
**So that** I have a consistent brand experience

**Acceptance Criteria:**
- [ ] Portal accessible at `portal.vendordomain.com`
- [ ] All links use custom domain
- [ ] Login/auth works on custom domain
- [ ] Emails link to custom domain

### US-WL-005: Offer Pages on Custom Domain
**As a** vendor  
**I want to** host my offer pages on my domain  
**So that** prospects see my brand throughout checkout

**Acceptance Criteria:**
- [ ] Offer pages at `vendordomain.com/offer-slug`
- [ ] Checkout flow stays on custom domain
- [ ] Thank you page on custom domain
- [ ] SEO attributes use custom domain

---

## 5. Technical Requirements

### 5.1 Database Schema

```sql
-- Custom domains table
CREATE TABLE vendor_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  domain_type TEXT NOT NULL DEFAULT 'portal', -- 'portal', 'offers', 'both'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'verifying', 'active', 'failed', 'expired'
  
  -- DNS verification
  verification_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  dns_verified_at TIMESTAMPTZ,
  
  -- SSL
  ssl_status TEXT DEFAULT 'pending', -- 'pending', 'provisioning', 'active', 'failed'
  ssl_provisioned_at TIMESTAMPTZ,
  ssl_expires_at TIMESTAMPTZ,
  
  -- Branding overrides
  custom_logo_url TEXT,
  custom_favicon_url TEXT,
  custom_colors JSONB,
  hide_powered_by BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ
);

-- Domain verification attempts
CREATE TABLE domain_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID REFERENCES vendor_domains(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL, -- 'dns_txt', 'dns_cname', 'http'
  status TEXT NOT NULL, -- 'success', 'failed'
  error_message TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_vendor_domains_domain ON vendor_domains(domain);
CREATE INDEX idx_vendor_domains_vendor ON vendor_domains(vendor_id);
CREATE INDEX idx_vendor_domains_status ON vendor_domains(status);
```

### 5.2 DNS Configuration Requirements

**Option A: CNAME (Recommended)**
```
portal.vendordomain.com  CNAME  domains.blogcanvas.com
```

**Option B: A Record (Apex domain)**
```
vendordomain.com  A  [BlogCanvas IP]
```

**Verification TXT Record**
```
_blogcanvas.vendordomain.com  TXT  "blogcanvas-verify=abc123..."
```

### 5.3 SSL Certificate Strategy

**Provider Options:**
1. **Let's Encrypt** (via Vercel/Cloudflare) - Free, auto-renewal
2. **Cloudflare for SaaS** - Managed SSL, easy setup
3. **AWS Certificate Manager** - If using AWS infrastructure

**Recommended: Cloudflare for SaaS**
- Automatic SSL provisioning
- DDoS protection included
- Analytics per domain
- Fallback origins

### 5.4 API Endpoints

```
# Domain Management
POST   /api/vendor/domains              - Add new domain
GET    /api/vendor/domains              - List vendor domains
GET    /api/vendor/domains/:id          - Get domain details
DELETE /api/vendor/domains/:id          - Remove domain
POST   /api/vendor/domains/:id/verify   - Trigger verification
POST   /api/vendor/domains/:id/refresh-ssl - Refresh SSL cert

# Internal/Webhook
POST   /api/domains/ssl-callback        - SSL provisioning callback
GET    /api/domains/resolve             - Resolve domain to vendor (internal)
```

### 5.5 Middleware for Domain Resolution

```typescript
// middleware.ts addition
async function resolveDomain(hostname: string) {
  // Check if custom domain
  if (!hostname.endsWith('blogcanvas.com')) {
    const domain = await getDomainConfig(hostname);
    if (domain?.status === 'active') {
      return {
        vendorId: domain.vendor_id,
        branding: domain.custom_colors,
        logo: domain.custom_logo_url,
        favicon: domain.custom_favicon_url,
        hidePoweredBy: domain.hide_powered_by
      };
    }
  }
  return null;
}
```

### 5.6 Environment Variables

```bash
# Cloudflare for SaaS
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_ZONE_ID=your-zone-id
CLOUDFLARE_FALLBACK_ORIGIN=blogcanvas.com

# Or Let's Encrypt
LETS_ENCRYPT_EMAIL=ssl@blogcanvas.com
LETS_ENCRYPT_DIRECTORY=https://acme-v02.api.letsencrypt.org/directory
```

---

## 6. UI/UX Requirements

### 6.1 Domain Setup Flow

```
┌─────────────────────────────────────────┐
│  Add Custom Domain                       │
├─────────────────────────────────────────┤
│                                          │
│  Domain: [portal.myagency.com      ]    │
│                                          │
│  Domain Type:                            │
│  ○ Client Portal only                   │
│  ○ Offer Pages only                     │
│  ● Both (recommended)                   │
│                                          │
│           [Cancel]  [Add Domain]         │
└─────────────────────────────────────────┘

         ↓ After adding

┌─────────────────────────────────────────┐
│  Configure DNS                           │
├─────────────────────────────────────────┤
│                                          │
│  Add these records to your DNS:          │
│                                          │
│  Type: CNAME                             │
│  Name: portal                            │
│  Value: domains.blogcanvas.com     [📋] │
│                                          │
│  Type: TXT                               │
│  Name: _blogcanvas                       │
│  Value: blogcanvas-verify=abc123   [📋] │
│                                          │
│  ⏳ Status: Waiting for DNS...           │
│                                          │
│           [Verify Now]                   │
└─────────────────────────────────────────┘

         ↓ After verification

┌─────────────────────────────────────────┐
│  ✅ Domain Active                        │
├─────────────────────────────────────────┤
│                                          │
│  portal.myagency.com                     │
│  SSL: ✅ Active (expires Jan 2027)       │
│  Status: ✅ Connected                    │
│                                          │
│  [Configure Branding]  [Remove Domain]   │
└─────────────────────────────────────────┘
```

### 6.2 Branding Configuration

```
┌─────────────────────────────────────────┐
│  Custom Branding for portal.myagency.com │
├─────────────────────────────────────────┤
│                                          │
│  Logo                                    │
│  ┌───────────┐                           │
│  │  [Upload] │  Current: mylogo.png      │
│  └───────────┘                           │
│                                          │
│  Favicon                                 │
│  ┌───────────┐                           │
│  │  [Upload] │  Current: favicon.ico     │
│  └───────────┘                           │
│                                          │
│  Primary Color: [#3b82f6] [🎨]           │
│  Accent Color:  [#10b981] [🎨]           │
│                                          │
│  ☑ Hide "Powered by BlogCanvas"         │
│                                          │
│           [Cancel]  [Save Changes]       │
└─────────────────────────────────────────┘
```

---

## 7. Implementation Plan

### Phase 1: Database & API (4 hours)
- [ ] Create migration for vendor_domains table
- [ ] Implement domain CRUD API
- [ ] Add DNS verification logic
- [ ] Create domain resolution middleware

### Phase 2: SSL Provisioning (4 hours)
- [ ] Integrate Cloudflare for SaaS API
- [ ] Implement SSL status webhooks
- [ ] Add SSL renewal cron job
- [ ] Handle provisioning failures

### Phase 3: Domain Settings UI (4 hours)
- [ ] Create domain management page
- [ ] DNS configuration display with copy buttons
- [ ] Verification status and retry
- [ ] Branding configuration form

### Phase 4: Routing & Branding (4 hours)
- [ ] Update middleware for custom domains
- [ ] Apply branding context to layouts
- [ ] Update all internal links
- [ ] Test auth flow on custom domains

### Phase 5: Testing & Documentation (4 hours)
- [ ] Test with real domains
- [ ] Document setup process
- [ ] Create troubleshooting guide
- [ ] Add to vendor onboarding

---

## 8. Pricing Tier Integration

| Tier | Custom Domains | White-Label |
|------|----------------|-------------|
| Free | 0 | No |
| Pro ($49/mo) | 1 | Partial (small "Powered by") |
| Business ($149/mo) | 5 | Full (no branding) |
| Enterprise | Unlimited | Full + custom features |

---

## 9. Testing Requirements

| Test Type | Coverage |
|-----------|----------|
| DNS verification | All record types |
| SSL provisioning | Success and failure paths |
| Domain routing | All page types |
| Auth on custom domain | Login, logout, token refresh |
| Email links | All transactional emails |
| SEO/meta tags | Correct domain in all tags |

---

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| DNS propagation delays | Medium | Show 24-48hr warning, retry logic |
| SSL provisioning failure | High | Fallback to blogcanvas.com, alerts |
| Domain hijacking attempts | High | Verify ownership before activation |
| Cookie/auth issues | High | Use proper cookie domain settings |

---

## 11. Future Enhancements

- [ ] Custom email sending domain (SPF/DKIM)
- [ ] Wildcard SSL for subdomains
- [ ] Domain health monitoring
- [ ] Automatic DNS configuration (via Cloudflare integration)
- [ ] Multi-region SSL edge caching

---

*Document Owner: Engineering*  
*Last Updated: January 19, 2026*
