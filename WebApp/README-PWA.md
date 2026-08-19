# QiblaAstro PWA Layer — v2.0

## Progressive Web App Integration Package

This package contains all files required to make QiblaAstro a production-ready
Progressive Web App (PWA) compatible with GitHub Pages, PWABuilder, Android
PWA installation, offline operation, and future native mobile conversion.

---

## 📁 Package Contents

### Core PWA Files
| File | Purpose |
|------|---------|
| `manifest.json` | Primary Web App Manifest (W3C standard) |
| `site.webmanifest` | Alternative manifest for broader compatibility |
| `service-worker.js` | Offline caching, background sync, push notifications |
| `offline.html` | Offline fallback page with retry functionality |

### Browser Configuration
| File | Purpose |
|------|---------|
| `browserconfig.xml` | Microsoft Edge/IE tile configuration |
| `icons/safari-pinned-tab.svg` | Safari pinned tab icon |

### SEO & Discovery
| File | Purpose |
|------|---------|
| `robots.txt` | Search engine crawling directives |
| `sitemap.xml` | XML sitemap for search engines |
| `humans.txt` | Credits, team info, technology stack |

### Legal & Security
| File | Purpose |
|------|---------|
| `LICENSE` | Proprietary software license |
| `SECURITY.md` | Security policy and vulnerability reporting |

### Icons (Generated from Logo)
| Path | Sizes | Purpose |
|------|-------|---------|
| `icons/icon-*.png` | 72×72 to 1024×1024 | Standard PWA icons |
| `icons/maskable/*.png` | 192×192, 512×512 | Adaptive/maskable icons |
| `icons/apple-touch-icon.png` | 180×180 | iOS home screen icon |
| `icons/apple-splash-*.png` | Various | iOS launch screens |
| `icons/mstile-144x144.png` | 144×144 | Windows tile image |
| `icons/favicon.ico` | 16×16 to 64×64 | Browser favicon |

---

## 🔧 Integration

### 1. Place Files
Copy all files from this package into your project root:
```
project-root/
├── index.html          (updated)
├── manifest.json
├── site.webmanifest
├── service-worker.js
├── offline.html
├── browserconfig.xml
├── robots.txt
├── sitemap.xml
├── humans.txt
├── SECURITY.md
├── LICENSE
├── icons/              (all icon files)
└── ...existing project files...
```

### 2. Verify index.html
The provided `index.html` has been updated with:
- Manifest links (`<link rel="manifest">`)
- Apple touch icons and splash screens
- Theme colors and mobile meta tags
- Service Worker registration script
- PWA install prompt handling
- Online/offline detection

### 3. Test PWA
- Open Chrome DevTools → Lighthouse → Run PWA audit
- Test offline functionality in DevTools Network tab
- Verify install prompt on Android Chrome
- Test "Add to Home Screen" on iOS Safari

---

## 🚀 PWA Features

### Offline Operation
- Core app shell cached on first visit
- Static assets (CSS, JS, images) served from cache
- Dynamic content cached with stale-while-revalidate
- Graceful offline page with auto-retry

### Installability
- Android: Add to Home Screen via Chrome menu
- iOS: Add to Home Screen via Safari share sheet
- Windows: Install via Edge browser
- Chrome OS: Install as standalone app

### Background Services
- Background sync for prayer time updates
- Push notifications for prayer alerts (when enabled)
- Periodic sync for daily prayer time pre-calculation

### Performance
- Pre-cached critical resources
- Lazy loading for non-critical assets
- Image caching with background revalidation
- Font preconnect for faster loading

---

## 📱 Platform Compatibility

| Platform | Status | Notes |
|----------|--------|-------|
| Android Chrome | ✅ Full | Install prompt, offline, push |
| Android Firefox | ✅ Full | Install via menu |
| iOS Safari | ✅ Full | Add to Home Screen, splash screens |
| iOS Chrome | ⚠️ Partial | Uses WebKit, no push notifications |
| Windows Edge | ✅ Full | Install as app, tile support |
| Windows Chrome | ✅ Full | Install as app |
| macOS Safari | ✅ Full | Add to Dock |
| macOS Chrome | ✅ Full | Install as app |
| GitHub Pages | ✅ Full | HTTPS required, fully supported |

---

## 🔒 Security

- Service Worker scope restricted to root (`/`)
- HTTPS-only for all PWA features
- No external script dependencies for core functionality
- Content Security Policy recommended for production deployment
- See `SECURITY.md` for vulnerability reporting

---

## 📄 License

© 2026 Mohamed Sayed Gabr Behairy. All Rights Reserved.
See `LICENSE` file for full terms.

---

## 👤 Author

**Mohamed Sayed Gabr Behairy**
- Arabic: محمد سيد جبر بحيرى
- Email: qiblaastro@protonmail.com
- Website: https://qiblaastro.github.io

---

*Generated: 2026-07-24*
