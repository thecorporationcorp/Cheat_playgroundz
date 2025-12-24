# Prompt Playgroundz

> A24-grade prompt optimization system. High-fidelity behavioral control through cinematic interaction design.

## 🎯 What This Is

Prompt Playgroundz is a Progressive Web App (PWA) that transforms plain-English prompts into structured, high-precision behavioral instruments. Think: **A24 film aesthetic meets YouTube Music UI meets editorial design**.

### Core Philosophy

- **Calm intelligence punctuated by rare dopamine spikes**
- **Restrained, intentional, cinematic**
- **Every motion signals meaning, not decoration**

### v1 Scope (LOCKED)

✅ **Wall** - Infinite prompt discovery
✅ **Copy/Inject** - Dopamine-driven interaction
✅ **Library** - Personal archive of copied prompts
✅ **PWA** - Full offline support with IndexedDB queue
✅ **Firebase** - Real-time sync with offline persistence

❌ Ratings (deferred to v2)
❌ Playlists (deferred to v2)
❌ Drops page (deferred to v2)
❌ Search optimization tiers (deferred to v2)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Firebase project with Firestore enabled
- Vite-compatible hosting (Netlify, Vercel, Firebase Hosting)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd Cheat_playgroundz

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Add your Firebase config to .env
# Edit the VITE_FIREBASE_CONFIG value with your actual Firebase credentials
```

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Firestore Database**
4. Enable **Anonymous Authentication** (or your preferred auth method)
5. Get your config from Project Settings → General → Your apps → Config
6. Copy the config object and stringify it into `.env`:

```env
VITE_FIREBASE_CONFIG='{"apiKey":"AIza...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}'
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/users/{userId}/library/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📦 Project Structure

```
Cheat_playgroundz/
├── public/
│   ├── icons/               # PWA icons (192x192, 512x512)
│   ├── manifest.json        # PWA manifest
│   └── offline.html         # Offline fallback page
├── src/
│   ├── App.jsx              # Main React component
│   ├── App.css              # All styles and animations
│   ├── main.jsx             # React entry point
│   ├── firebase.js          # Firebase initialization with safety
│   ├── offlineQueue.js      # IndexedDB offline write queue
│   └── utils.js             # Utility functions
├── index.html               # Entry HTML
├── vite.config.js           # Vite + PWA config
├── package.json
└── README.md
```

---

## 🎨 Design System

### Typography

- **Display**: Anton (titles, prompts, headings)
- **UI**: Space Mono (labels, metadata, controls)

### Colors

```css
--black: #000000
--near-black: #050505
--dark-bg: #080808
--off-black: #0a0a0a
--white: #ffffff
--red: #ff0000
--yellow: #e0b300
```

### Interaction Principles

1. **Four Corners (LOCKED)**
   - Top-Left: Copy/Inject (primary action)
   - Top-Right: Info/Details
   - Bottom-Left: Delete/Remove
   - Bottom-Right: Like/Favorite

2. **The Inject Sequence**
   - Central status overlay appears
   - Glitch text effect
   - Progress bar animation
   - Copy confirmation
   - Total duration: ~1.7s

3. **Wall Motion**
   - Deterministic shuffle on mount
   - Seamless infinite scroll
   - No duplicate prompts visible simultaneously
   - 20 rows, staggered speeds

---

## 🔧 Configuration

### PWA Settings (vite.config.js)

- **registerType**: `autoUpdate` - SW updates automatically
- **Cache strategy**: Network-first for Firebase, Cache-first for fonts/images
- **Offline support**: Full app shell caching + offline write queue

### Firebase Settings (src/firebase.js)

- **Offline persistence**: Enabled with tab sync
- **Anonymous auth**: Automatic sign-in
- **Error handling**: Graceful degradation if config missing

### Offline Queue (src/offlineQueue.js)

- **Storage**: IndexedDB with `ppz-offline-queue` database
- **Retry logic**: 3 attempts with 1s delay
- **Concurrent init protection**: Promise caching + lock mechanism
- **Auto-sync**: Triggers on reconnection

---

## 🚢 Deployment

### Netlify

```bash
# Build command
npm run build

# Publish directory
dist

# Environment variables (in Netlify UI)
VITE_FIREBASE_CONFIG = '{"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}'
```

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variable
vercel env add VITE_FIREBASE_CONFIG
```

### Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize hosting
firebase init hosting

# Build and deploy
npm run build
firebase deploy --only hosting
```

### Post-Deployment Checklist

- [ ] PWA installs correctly on mobile
- [ ] Service worker caches assets
- [ ] Offline mode works (airplane mode test)
- [ ] Firebase reads/writes function
- [ ] Offline queue syncs when reconnected
- [ ] Copy to clipboard works (test on iOS Safari)
- [ ] Animations are smooth (60fps target)
- [ ] Icons display correctly in app drawer

---

## 📱 PWA Features

### Install Prompt

The app will prompt users to install after they've:
- Visited the site
- Engaged with the prompt wall
- Copied at least one prompt

### Offline Functionality

When offline, the app will:
- ✅ Display all previously loaded content
- ✅ Queue write operations (add/update/delete)
- ✅ Show offline indicator
- ✅ Auto-sync when connection restores
- ✅ Display offline fallback page if app hasn't loaded

### Shortcuts

Installed PWA includes shortcuts:
- **Playground** - Direct to prompt wall
- **Library** - Direct to saved prompts

---

## 🔐 Security

### Implemented Protections

1. **Firebase Config Validation**
   - Required fields check
   - Format validation
   - Frozen config objects

2. **Input Sanitization**
   - XSS prevention in clipboard operations
   - Markdown stripping from payloads

3. **Firestore Rules**
   - User isolation (can only access own library)
   - Authentication required

### Recommended Additions

1. **Content Security Policy** (add to hosting headers):
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https://images.unsplash.com https://firebasestorage.googleapis.com data:; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com
```

2. **Error Tracking** (Sentry, LogRocket):
```javascript
// Add to src/main.jsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: import.meta.env.MODE,
});
```

---

## 🐛 Troubleshooting

### Firebase Not Connecting

1. Check `.env` file exists and has valid JSON
2. Verify Firebase config is correct (copy-paste from console)
3. Check browser console for specific error
4. Ensure Firestore is enabled in Firebase Console
5. Verify security rules allow your auth method

### Service Worker Not Updating

1. Unregister old service worker in DevTools → Application → Service Workers
2. Clear cache storage
3. Hard reload (Cmd+Shift+R / Ctrl+Shift+R)
4. Check `vite.config.js` has `registerType: 'autoUpdate'`

### Clipboard Copy Failing

1. Ensure site is served over HTTPS (required for Clipboard API)
2. On iOS Safari, user gesture required (copy must be click-triggered)
3. Fallback to `execCommand` should handle older browsers
4. Check browser console for permission errors

### Offline Queue Not Syncing

1. Verify IndexedDB is supported (check `window.indexedDB`)
2. Check browser console for DB initialization errors
3. Ensure `setupOfflineSync()` is called in App
4. Test with DevTools → Network → Offline mode

### Animations Janky

1. Check `prefers-reduced-motion` setting in OS
2. Reduce number of simultaneous animations
3. Use `will-change` CSS property sparingly
4. Test on target device (mobile performance differs)

---

## 📊 Performance Targets

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Lighthouse PWA Score**: 90+
- **Frame Rate**: 60fps on mid-tier mobile
- **Bundle Size**: < 500KB (gzipped)

### Optimization Checklist

- [x] Code splitting (React.lazy if needed)
- [x] Tree shaking via Vite
- [x] Font preloading
- [x] Image optimization (Unsplash auto-format)
- [x] Service worker caching
- [ ] Analytics (deferred)
- [ ] Error tracking (recommended)

---

## 🔮 Future Roadmap (v2+)

### Features

- [ ] **Rating System** - 5-star private ratings with modal UI
- [ ] **Playlists** - Custom collections of prompts
- [ ] **Drops Page** - Editorial content, essays, signature prompts
- [ ] **Search Optimizer** - Tiered prompt refinement ($0.99-$4.99)
- [ ] **Social Sharing** - Share prompts with preview cards
- [ ] **Advanced Filters** - Search library by phase, rating, date
- [ ] **Export** - Download library as JSON/CSV

### Infrastructure

- [ ] **Tests** - Unit, integration, E2E (Vitest + Playwright)
- [ ] **CI/CD** - Automated deploy on merge
- [ ] **Analytics** - Privacy-focused usage tracking
- [ ] **A/B Testing** - Experiment framework
- [ ] **Internationalization** - Multi-language support

---

## 🤝 Contributing

This is a solo project by **thecorporationcorp**, but feedback is welcome.

### Guidelines

1. **Scope Lock** - v1 features are frozen, v2+ ideas go in Issues
2. **A24 Aesthetic** - Maintain restrained, cinematic design language
3. **Performance First** - No feature ships if it degrades UX
4. **Mobile Matters** - Test on actual devices, not just DevTools

---

## 📄 License

Proprietary - All rights reserved by thecorporationcorp

---

## 🙏 Credits

- **Design & Development**: thecorporationcorp
- **Typefaces**: Anton (Vernon Adams), Space Mono (Colophon Foundry)
- **Images**: Unsplash (various contributors)
- **Infrastructure**: Firebase, Vite, React

---

## 💬 Support

For bugs or questions, open an issue on GitHub.

**Built with obsessive attention to detail by thecorporationcorp**

_"Calm intelligence punctuated by rare dopamine spikes"_
