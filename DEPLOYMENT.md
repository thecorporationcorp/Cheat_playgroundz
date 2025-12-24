# Deployment Guide - Prompt Playgroundz

## Pre-Deployment Checklist

Before deploying to production, ensure:

- [ ] Firebase project is created and configured
- [ ] Firestore database is enabled
- [ ] Authentication is enabled (Anonymous or preferred method)
- [ ] Security rules are deployed
- [ ] Icons are generated and placed in `public/icons/`
- [ ] `.env` file has valid Firebase config
- [ ] App builds without errors (`npm run build`)
- [ ] App works in production mode (`npm run preview`)

---

## Firebase Setup (Required First Step)

### 1. Create Firebase Project

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project (optional, for Firebase Hosting)
firebase init
```

### 2. Enable Services

In [Firebase Console](https://console.firebase.google.com/):

1. **Firestore Database**
   - Click "Create Database"
   - Start in production mode
   - Choose region closest to users

2. **Authentication**
   - Click "Get Started"
   - Enable "Anonymous" provider
   - (Optional) Enable other providers later

### 3. Deploy Security Rules

Create `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User library - only owner can access
    match /artifacts/{appId}/users/{userId}/library/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Prevent access to other collections
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Deploy rules:

```bash
firebase deploy --only firestore:rules
```

### 4. Get Firebase Config

1. Go to Project Settings → General
2. Scroll to "Your apps"
3. Click "Add app" → Web (</> icon)
4. Register app (nickname: "Prompt Playgroundz")
5. Copy the config object

Example config:
```javascript
{
  "apiKey": "AIzaSyXxXxXxXxXxXxXxXxXxXxXxXxXxXxX",
  "authDomain": "your-project.firebaseapp.com",
  "projectId": "your-project-id",
  "storageBucket": "your-project.appspot.com",
  "messagingSenderId": "123456789012",
  "appId": "1:123456789012:web:abcdefghijklmnop"
}
```

### 5. Create `.env` File

**IMPORTANT**: Stringify the config into a single line:

```env
VITE_FIREBASE_CONFIG='{"apiKey":"AIzaSy...","authDomain":"your-project.firebaseapp.com","projectId":"your-project-id","storageBucket":"your-project.appspot.com","messagingSenderId":"123456789012","appId":"1:123456789012:web:abc..."}'
```

**Critical**: No spaces, wrapped in single quotes.

---

## Deployment Options

### Option 1: Netlify (Recommended)

#### Via Netlify UI

1. Push code to GitHub
2. Go to [Netlify](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect GitHub repo
5. Configure build:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Add environment variable:
   - Key: `VITE_FIREBASE_CONFIG`
   - Value: `'{"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}'`
7. Click "Deploy site"

#### Via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Link to existing site or create new
netlify link

# Set environment variable
netlify env:set VITE_FIREBASE_CONFIG '{"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}'

# Deploy
netlify deploy --prod
```

#### Netlify Configuration File

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"

[[headers]]
  for = "/manifest.json"
  [headers.values]
    Content-Type = "application/manifest+json"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

---

### Option 2: Vercel

#### Via Vercel UI

1. Push code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Click "Add New..." → "Project"
4. Import GitHub repo
5. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add environment variable:
   - Key: `VITE_FIREBASE_CONFIG`
   - Value: Your stringified Firebase config
7. Click "Deploy"

#### Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to production
vercel --prod

# Set environment variable
vercel env add VITE_FIREBASE_CONFIG production
# Paste your stringified Firebase config when prompted
```

#### Vercel Configuration File

Create `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

---

### Option 3: Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize hosting (one-time)
firebase init hosting
# Select:
# - Existing project: [your-project-id]
# - Public directory: dist
# - Single-page app: Yes
# - Automatic builds with GitHub: Optional

# Build the app
npm run build

# Deploy
firebase deploy --only hosting
```

#### Firebase Hosting Configuration

Edit `firebase.json`:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

---

## Post-Deployment Testing

### PWA Installation Test

1. **Desktop (Chrome/Edge)**
   - Visit deployed URL
   - Look for install icon in address bar
   - Click install
   - Verify app opens in standalone window
   - Check app icon in dock/taskbar

2. **Mobile (iOS Safari)**
   - Visit deployed URL
   - Tap Share button
   - Tap "Add to Home Screen"
   - Verify icon appears on home screen
   - Tap icon to open
   - Check runs in standalone mode (no browser chrome)

3. **Mobile (Android Chrome)**
   - Visit deployed URL
   - Tap "Add to Home screen" banner
   - Or: Menu → "Install app"
   - Verify icon appears
   - Open and check standalone mode

### Offline Mode Test

1. Open app in browser
2. Copy a prompt (adds to library)
3. Open DevTools → Network
4. Select "Offline" in throttling dropdown
5. Refresh page
6. Verify:
   - [ ] App loads (from service worker cache)
   - [ ] Previously loaded library items visible
   - [ ] Can navigate between views
   - [ ] Offline indicator shows (if implemented)
7. Try to copy another prompt
8. Go back online
9. Verify queued write syncs

### Firebase Connectivity Test

1. Open DevTools → Console
2. Look for:
   ```
   ✅ Firebase offline persistence enabled
   ✅ Signed in anonymously (or custom token)
   ```
3. Copy a prompt
4. Check DevTools → Application → IndexedDB → Firebase
5. Verify document appears in `firestore` database
6. Check Firebase Console → Firestore
7. Verify document created at correct path:
   ```
   artifacts/prompt-playgroundz-v1/users/{uid}/library/{doc-id}
   ```

### Performance Test

1. Open DevTools → Lighthouse
2. Run audit with:
   - [ ] Performance
   - [ ] PWA
   - [ ] Best Practices
   - [ ] Accessibility
3. Target scores:
   - Performance: 90+
   - PWA: 90+
   - Best Practices: 90+
   - Accessibility: 80+

---

## Troubleshooting Deployment Issues

### Build Fails

**Error**: `Module not found` or `Cannot find module`

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Error**: `VITE_FIREBASE_CONFIG is not defined`

**Solution**: Verify environment variable is set in hosting platform. Check for:
- Typos in variable name
- Missing quotes around JSON
- Invalid JSON format

### Service Worker Not Registering

**Error**: `Service worker registration failed`

**Solution**:
- Ensure site is HTTPS (required for SW)
- Check `vite.config.js` has `VitePWA` plugin
- Verify `dist/sw.js` exists after build
- Clear browser cache and hard reload

### Firebase Connection Fails

**Error**: `Firebase initialization failed` in console

**Solution**:
1. Verify Firebase config in `.env` is valid JSON
2. Check Firebase project exists and Firestore is enabled
3. Ensure auth provider (Anonymous) is enabled
4. Check CORS settings if seeing network errors
5. Verify security rules allow authenticated access

### Icons Not Showing

**Error**: Broken image icon in PWA install prompt

**Solution**:
1. Verify `icon-192.png` and `icon-512.png` exist in `public/icons/`
2. Check `manifest.json` paths are correct
3. Clear browser cache
4. Check DevTools → Application → Manifest for errors
5. Ensure icons are proper PNG format and dimensions

---

## Environment Variables Reference

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `VITE_FIREBASE_CONFIG` | Yes | `'{"apiKey":"...",...}'` | Must be stringified JSON in single quotes |
| `VITE_INITIAL_AUTH_TOKEN` | No | `eyJhbGc...` | Custom auth token for SSR |

---

## Monitoring & Maintenance

### Recommended Tools

1. **Error Tracking**: [Sentry](https://sentry.io)
   ```bash
   npm install @sentry/react
   ```

2. **Analytics**: [Plausible](https://plausible.io) or [Fathom](https://usefathom.com)
   - Privacy-focused
   - No cookie consent needed
   - Simple integration

3. **Uptime Monitoring**: [UptimeRobot](https://uptimerobot.com)
   - Free tier available
   - Email alerts

### Firebase Usage Monitoring

Check [Firebase Console](https://console.firebase.google.com/) regularly:

- **Firestore Usage**: Documents read/written (free tier: 50K reads/day)
- **Auth Usage**: Active users
- **Storage**: If using Firebase Storage later

---

## Rollback Procedure

If deployment breaks production:

### Netlify
```bash
# Via UI: Deploys → Click "Publish deploy" on previous working version

# Via CLI:
netlify rollback
```

### Vercel
```bash
# Via UI: Deployments → Select working deployment → Promote to Production

# Via CLI:
vercel rollback [deployment-url]
```

### Firebase Hosting
```bash
# List previous deployments
firebase hosting:channel:list

# Rollback to specific version
firebase hosting:rollback
```

---

## Security Headers (Production)

Add these headers via your hosting platform:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https://images.unsplash.com https://firebasestorage.googleapis.com data:; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com
```

---

## Support

For deployment issues:
- Check this guide first
- Review platform-specific documentation
- Open GitHub issue with error logs

**Last updated**: December 2024
