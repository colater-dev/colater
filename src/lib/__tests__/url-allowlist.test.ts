import { describe, it, expect } from 'vitest';
import { isAllowedUrl } from '../server-auth';

describe('isAllowedUrl', () => {
  // -----------------------------------------------------------------------
  // Allowed URLs
  // -----------------------------------------------------------------------

  describe('allows known storage providers', () => {
    it('allows Firebase Storage URLs', () => {
      expect(
        isAllowedUrl(
          'https://firebasestorage.googleapis.com/v0/b/my-bucket/o/logo.png?alt=media'
        )
      ).toBe(true);
    });

    it('allows Google Cloud Storage URLs', () => {
      expect(
        isAllowedUrl('https://storage.googleapis.com/my-bucket/logo.png')
      ).toBe(true);
    });

    it('allows Cloudflare R2 URLs', () => {
      expect(
        isAllowedUrl('https://pub-abc123.r2.dev/logos/brand-logo.png')
      ).toBe(true);
    });

    it('allows Fal.media URLs', () => {
      expect(
        isAllowedUrl('https://v3.fal.media/files/abc/output.png')
      ).toBe(true);
    });

    it('allows Fal.ai URLs', () => {
      expect(
        isAllowedUrl('https://storage.fal.ai/outputs/image.png')
      ).toBe(true);
    });

    it('allows Replicate delivery URLs', () => {
      expect(
        isAllowedUrl(
          'https://pbxt.replicate.delivery/abc123/output.png'
        )
      ).toBe(true);
    });

    it('allows Replicate.com URLs', () => {
      expect(
        isAllowedUrl('https://output.replicate.com/abc123/image.png')
      ).toBe(true);
    });
  });

  describe('allows data URIs', () => {
    it('allows PNG data URIs', () => {
      expect(isAllowedUrl('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
    });

    it('allows JPEG data URIs', () => {
      expect(isAllowedUrl('data:image/jpeg;base64,/9j/4AAQ=')).toBe(true);
    });

    it('allows SVG data URIs', () => {
      expect(
        isAllowedUrl('data:image/svg+xml;base64,PHN2ZyB4bWxucz0=')
      ).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Blocked URLs
  // -----------------------------------------------------------------------

  describe('blocks internal / private IPs', () => {
    it('blocks localhost', () => {
      expect(isAllowedUrl('http://localhost/secret')).toBe(false);
    });

    it('blocks localhost with port', () => {
      expect(isAllowedUrl('http://localhost:3000/api/internal')).toBe(false);
    });

    it('blocks 127.0.0.1', () => {
      expect(isAllowedUrl('http://127.0.0.1/admin')).toBe(false);
    });

    it('blocks 127.x.x.x range', () => {
      expect(isAllowedUrl('http://127.255.0.1/data')).toBe(false);
    });

    it('blocks 10.x private IPs', () => {
      expect(isAllowedUrl('http://10.0.0.1/internal')).toBe(false);
    });

    it('blocks 172.16.x private IPs', () => {
      expect(isAllowedUrl('http://172.16.0.1/internal')).toBe(false);
    });

    it('blocks 172.31.x private IPs', () => {
      expect(isAllowedUrl('http://172.31.255.255/internal')).toBe(false);
    });

    it('blocks 192.168.x private IPs', () => {
      expect(isAllowedUrl('http://192.168.1.1/admin')).toBe(false);
    });

    it('blocks cloud metadata endpoint (169.254.169.254)', () => {
      expect(
        isAllowedUrl('http://169.254.169.254/latest/meta-data/')
      ).toBe(false);
    });

    it('blocks IPv6 loopback [::1]', () => {
      expect(isAllowedUrl('http://[::1]/secret')).toBe(false);
    });

    it('blocks 0.x addresses', () => {
      expect(isAllowedUrl('http://0.0.0.0/')).toBe(false);
    });
  });

  describe('blocks arbitrary external URLs', () => {
    it('blocks random HTTP URLs', () => {
      expect(isAllowedUrl('https://evil.com/steal-data')).toBe(false);
    });

    it('blocks HTTP URLs', () => {
      expect(isAllowedUrl('http://attacker.org/ssrf')).toBe(false);
    });

    it('blocks URLs that look similar to allowed hosts', () => {
      expect(
        isAllowedUrl('https://not-firebasestorage.googleapis.com.evil.com/data')
      ).toBe(false);
    });

    it('blocks URLs with allowed host as subdomain of attacker domain', () => {
      expect(
        isAllowedUrl('https://firebasestorage.googleapis.com.evil.com/data')
      ).toBe(false);
    });
  });

  describe('blocks malformed URLs', () => {
    it('blocks empty string', () => {
      expect(isAllowedUrl('')).toBe(false);
    });

    it('blocks garbage input', () => {
      expect(isAllowedUrl('not-a-url')).toBe(false);
    });

    it('blocks javascript: protocol', () => {
      expect(isAllowedUrl('javascript:alert(1)')).toBe(false);
    });

    it('blocks file: protocol', () => {
      expect(isAllowedUrl('file:///etc/passwd')).toBe(false);
    });
  });
});
