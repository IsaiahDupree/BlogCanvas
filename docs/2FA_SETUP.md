# Two-Factor Authentication (2FA) Setup Guide

## Overview

BlogCanvas supports TOTP-based two-factor authentication (2FA) to add an extra layer of security to user accounts. This feature is **automatically enforced** for admin users (owner, staff roles) and optional for client users.

## Features

✅ TOTP-based authentication using authenticator apps
✅ QR code generation for easy setup
✅ Backup codes for account recovery
✅ Automatic enforcement for admin roles
✅ Audit logging of all 2FA events
✅ Support for multiple authenticator apps (Google Authenticator, Authy, 1Password, etc.)

## Prerequisites

1. **Environment Variable Configuration**

Add the following to your `.env.local` file:

```bash
# Generate a 64-character hex key using:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
TOTP_ENCRYPTION_KEY=your_64_character_hex_key_here
```

**Important:** Keep this key secure and never commit it to version control. This key is used to encrypt TOTP secrets in the database.

2. **Database Migration**

Apply the 2FA database migration:

```bash
# If using Supabase CLI
npx supabase db push

# Or apply the migration file directly
# supabase/migrations/20260113000005_two_factor_auth.sql
```

## User Flows

### 1. Admin User First Login (2FA Required)

When an admin user logs in for the first time after 2FA is deployed:

1. User enters email and password
2. System detects 2FA is enforced but not enabled
3. User is redirected to 2FA setup
4. User scans QR code with authenticator app
5. User enters verification code
6. System generates 10 backup codes
7. User saves backup codes
8. 2FA is now enabled and enforced

### 2. Regular Login with 2FA Enabled

1. User enters email and password
2. System detects 2FA is enabled
3. User is prompted for 6-digit code
4. User enters code from authenticator app (or backup code)
5. System verifies code
6. User is logged in

### 3. Using Backup Codes

If user loses their authenticator device:

1. User attempts to log in
2. User clicks "Use backup code instead"
3. User enters one of their backup codes
4. System marks the code as used
5. User is logged in
6. System warns if running low on backup codes

### 4. Disabling 2FA (Non-Admin Only)

Regular users can disable 2FA:

1. Navigate to Settings → Two-Factor Authentication
2. Click "Disable 2FA"
3. Enter password to confirm
4. 2FA is disabled and backup codes are deleted

**Note:** Admin users cannot disable 2FA due to enforcement policy.

## API Endpoints

### Setup 2FA
- **POST** `/api/auth/2fa/setup` - Initialize 2FA setup, get QR code
- **GET** `/api/auth/2fa/setup` - Get current 2FA status

### Verify Token
- **POST** `/api/auth/2fa/verify` - Verify TOTP token (setup or login)

### Disable 2FA
- **POST** `/api/auth/2fa/disable` - Disable 2FA (requires password or token)

### Backup Codes
- **GET** `/api/auth/2fa/backup-codes` - Get backup codes status
- **POST** `/api/auth/2fa/backup-codes` - Regenerate backup codes

### Recovery
- **POST** `/api/auth/2fa/recovery` - Use backup code for recovery

## Database Tables

### `user_2fa_settings`
Stores 2FA configuration for each user:
- `enabled` - Whether 2FA is active
- `enforced` - Whether 2FA is required (admin users)
- `totp_secret` - Encrypted TOTP secret
- `totp_verified` - Whether TOTP has been verified
- `backup_codes_count` - Number of unused backup codes

### `user_2fa_backup_codes`
Stores hashed backup codes:
- `code_hash` - Bcrypt hash of the backup code
- `used` - Whether the code has been used
- `used_at` - When the code was used

### `user_2fa_audit_log`
Logs all 2FA events:
- `event_type` - Type of event (enabled, disabled, verified, etc.)
- `ip_address` - User's IP address
- `user_agent` - User's browser/device
- `metadata` - Additional event data

## Security Considerations

1. **Encryption**: TOTP secrets are encrypted using AES-256-GCM before storage
2. **Hashing**: Backup codes are hashed using bcrypt (cost factor 10)
3. **Time Window**: TOTP tokens are valid for 30 seconds with a 1-step window for clock skew
4. **Rate Limiting**: Consider implementing rate limiting on verification endpoints
5. **Audit Logging**: All 2FA events are logged for security monitoring
6. **RLS Policies**: All tables have Row Level Security enabled

## Supported Authenticator Apps

- Google Authenticator (iOS, Android)
- Microsoft Authenticator (iOS, Android)
- Authy (iOS, Android, Desktop)
- 1Password (with TOTP support)
- Bitwarden (with premium)
- LastPass Authenticator
- Any TOTP-compatible app

## Testing

To test 2FA functionality:

1. **Setup Flow**:
   ```bash
   # Visit the 2FA settings page
   http://localhost:4848/app/settings/2fa

   # Click "Enable 2FA"
   # Scan QR code or enter manual key
   # Enter verification code
   # Save backup codes
   ```

2. **Login Flow**:
   ```bash
   # Log out and log back in
   # Enter email and password
   # Enter 2FA code when prompted
   ```

3. **Recovery Flow**:
   ```bash
   # During login, click "Use backup code"
   # Enter one of your backup codes
   ```

## Troubleshooting

### "Invalid or expired token"
- Ensure your device time is synchronized (TOTP depends on accurate time)
- Try the next code from your authenticator app
- Check that you're using the correct account in your authenticator app

### "TOTP_ENCRYPTION_KEY environment variable is not set"
- Add the `TOTP_ENCRYPTION_KEY` to your `.env.local` file
- Generate a new key using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Restart your development server

### "2FA is enforced for your role and cannot be disabled"
- This is expected for admin users (owner, staff)
- 2FA enforcement helps protect administrative accounts
- Contact system admin if you need to change roles

## Future Enhancements

Potential improvements for future versions:

- [ ] SMS-based 2FA as alternative to TOTP
- [ ] Hardware security key support (WebAuthn/FIDO2)
- [ ] Trusted device management
- [ ] Email-based backup codes delivery
- [ ] Admin dashboard for 2FA enforcement policies
- [ ] Grace period for 2FA enforcement
- [ ] Account recovery flow via support ticket

## Support

For issues or questions about 2FA:
1. Check the troubleshooting section above
2. Review the audit logs in `user_2fa_audit_log` table
3. Contact your system administrator
4. Open an issue on GitHub
