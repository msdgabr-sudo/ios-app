# Security Policy — QiblaAstro

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |
| < 2.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in QiblaAstro, please report it responsibly:

1. **Do NOT** open a public issue
2. Email: **qiblaastro@protonmail.com**
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will acknowledge receipt within 48 hours and provide a timeline for resolution within 7 days.

## Security Measures

### Client-Side
- All astronomical calculations run locally — no sensitive location data leaves the device
- Geolocation data is processed in-browser only
- No third-party tracking scripts
- Content Security Policy (CSP) headers recommended for deployment

### Data Privacy
- No user accounts or personal data collection
- Prayer times calculated locally using device time
- Optional GPS location used only for qibla calculation
- No analytics or telemetry without explicit consent

### Dependencies
- Zero external JavaScript dependencies (vanilla JS)
- Google Fonts loaded with `preconnect` for performance only
- No CDN-hosted scripts for core functionality

### PWA Security
- Service Worker uses strict scope (`/`)
- Cache strategies prevent injection attacks
- HTTPS-only for all PWA features
- Manifest validated against W3C schema

## Disclosure Policy

We follow responsible disclosure:
1. Report received and acknowledged
2. Fix developed and tested
3. Fix deployed
4. Public disclosure after 30 days or with reporter's consent

## Acknowledgments

We thank security researchers who help keep QiblaAstro safe.
