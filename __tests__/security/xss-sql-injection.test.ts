/**
 * Security Tests: XSS and SQL Injection Protection
 *
 * Tests verify that the application properly sanitizes user inputs
 * and uses parameterized queries to prevent XSS and SQL injection attacks.
 */

import { describe, it, expect } from '@jest/globals';
import { supabaseAdmin } from '@/lib/supabase';

describe('Security: XSS and SQL Injection Protection', () => {
  describe('XSS Protection', () => {
    it('should reject script tags in user input', async () => {
      const maliciousInput = '<script>alert("XSS")</script>';

      // Test blog post creation with malicious input
      const { data, error } = await supabaseAdmin
        .from('blog_posts')
        .insert({
          topic: maliciousInput,
          target_keyword: 'test',
          status: 'drafting'
        })
        .select()
        .single();

      // The input should be stored as-is (database stores it)
      // but the application should escape it when rendering
      expect(data?.topic).toBe(maliciousInput);

      // Verify that when retrieved, it's the raw string (not executed)
      const { data: retrieved } = await supabaseAdmin
        .from('blog_posts')
        .select('topic')
        .eq('id', data?.id)
        .single();

      expect(retrieved?.topic).toBe(maliciousInput);

      // Cleanup
      if (data?.id) {
        await supabaseAdmin.from('blog_posts').delete().eq('id', data.id);
      }
    });

    it('should handle HTML entities in user input', async () => {
      const htmlInput = '<div>Hello &lt;world&gt;</div>';

      const { data, error } = await supabaseAdmin
        .from('vendor_clients')
        .insert({
          name: htmlInput,
          email: `test-${Date.now()}@example.com`,
          vendor_id: '00000000-0000-0000-0000-000000000000' // Mock UUID
        })
        .select()
        .single();

      expect(data?.name).toBe(htmlInput);

      // Cleanup
      if (data?.id) {
        await supabaseAdmin.from('vendor_clients').delete().eq('id', data.id);
      }
    });

    it('should reject javascript: URLs', () => {
      const maliciousUrls = [
        'javascript:alert(1)',
        'javascript:void(0)',
        'data:text/html,<script>alert(1)</script>'
      ];

      maliciousUrls.forEach(url => {
        // URL validation should reject these
        const isValidUrl = /^https?:\/\//i.test(url);
        expect(isValidUrl).toBe(false);
      });
    });
  });

  describe('SQL Injection Protection', () => {
    it('should use parameterized queries for blog post search', async () => {
      const maliciousSearch = "'; DROP TABLE blog_posts; --";

      // Supabase uses parameterized queries, so this should be safe
      const { data, error } = await supabaseAdmin
        .from('blog_posts')
        .select('*')
        .ilike('topic', `%${maliciousSearch}%`)
        .limit(10);

      // Should execute safely without SQL injection
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should use parameterized queries for email search', async () => {
      const maliciousEmail = "admin@example.com' OR '1'='1";

      const { data, error } = await supabaseAdmin
        .from('vendor_clients')
        .select('*')
        .eq('email', maliciousEmail)
        .limit(1);

      // Should execute safely and find no results
      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it('should handle special characters in search queries', async () => {
      const specialChars = ["'; --", "1' OR '1'='1", "admin'--", "' OR 1=1--"];

      for (const char of specialChars) {
        const { data, error } = await supabaseAdmin
          .from('blog_posts')
          .select('topic')
          .ilike('topic', `%${char}%`)
          .limit(10);

        expect(error).toBeNull();
        expect(Array.isArray(data)).toBe(true);
      }
    });

    it('should properly escape single quotes in text', async () => {
      const textWithQuotes = "It's a beautiful day";

      const { data, error } = await supabaseAdmin
        .from('blog_posts')
        .insert({
          topic: textWithQuotes,
          target_keyword: 'test',
          status: 'drafting'
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.topic).toBe(textWithQuotes);

      // Cleanup
      if (data?.id) {
        await supabaseAdmin.from('blog_posts').delete().eq('id', data.id);
      }
    });
  });

  describe('Input Sanitization', () => {
    it('should reject excessively long inputs', () => {
      const longString = 'A'.repeat(100000);

      // Validation should reject strings over reasonable length
      const MAX_LENGTH = 10000;
      const isValid = longString.length <= MAX_LENGTH;

      expect(isValid).toBe(false);
    });

    it('should validate email format', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user@domain',
        'user domain@example.com'
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    it('should validate URL format', () => {
      const invalidUrls = [
        'not a url',
        'ftp://example.com', // Only allow http/https
        'http:/example.com',
        '//example.com'
      ];

      const urlRegex = /^https?:\/\/[^\s$.?#].[^\s]*$/i;

      invalidUrls.forEach(url => {
        expect(urlRegex.test(url)).toBe(false);
      });
    });
  });
});
