# FitLife

A mobile-first gym & fitness app: workout library across 7 muscle groups,
weekly planner, BMI/calorie calculators, weight & measurement tracker with
charts, diet plans, water tracker, exercise timer/stopwatch, push
notification reminders, and an admin panel — built with Next.js and
Firebase, ready to deploy on Vercel.

## Folder structure

```
fitlife-app/
├─ components/          Reusable UI: Header, BottomNav, ExerciseCard,
│                        ExerciseTimer, Stopwatch, AdminGuard
├─ context/              ThemeContext (dark/light), AuthContext (Firebase Auth)
├─ lib/                  firebase.js (SDK init), firestore.js (data layer),
│                        data.js (seed exercises & diet plans)
├─ pages/
│  ├─ index.js           Dashboard
│  ├─ workouts/          Category list + [category] exercise list
│  ├─ planner.js         Weekly workout planner
│  ├─ calculators.js     BMI + calorie calculator
│  ├─ tracker.js         Weight/measurement tracker with charts
│  ├─ diet.js            Diet plans
│  ├─ water.js           Water intake tracker
│  ├─ timer.js           Timer + stopwatch
│  ├─ more.js            Sign in, notifications, admin link
│  └─ admin/             Admin panel (workouts, diets, users)
├─ public/               manifest.json, app icons, FCM service worker
└─ styles/globals.css    Design tokens + dark/light themes
```

## 1. Set up Firebase

1. Create a project at https://console.firebase.google.com
2. Add a **Web app** to it and copy the config values it gives you.
3. Enable **Authentication → Sign-in method → Google**.
4. Enable **Firestore Database** (start in production mode).
5. Enable **Cloud Messaging** and generate a **Web Push certificate**
   (Project settings → Cloud Messaging) to get your VAPID key.

Copy `.env.local.example` to `.env.local` and fill in every value:

```bash
cp .env.local.example .env.local
```

Set `NEXT_PUBLIC_ADMIN_EMAILS` to the email address(es) that should have
access to `/admin`.

Because service workers can't read `process.env`, also paste the same
Firebase config values into `public/firebase-messaging-sw.js` (replacing
the `REPLACE_WITH_...` strings) so background push notifications work.

## 2. Firestore Security Rules

The client only checks `NEXT_PUBLIC_ADMIN_EMAILS` in the UI — real
enforcement has to happen in Firestore itself. Paste this into
**Firestore → Rules**, swapping in your own admin email(s):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null &&
        request.auth.token.email in ['you@example.com'];
    }

    match /exercises/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /dietPlans/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (request.auth.uid == uid || isAdmin());

      match /logs/{logId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
      match /water/{day} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
      match /plans/{week} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
  }
}
```

## 3. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. The first load automatically copies the
built-in exercise/diet library into Firestore (`lib/firestore.js` →
`seedIfEmpty`), so after that you can edit everything from `/admin`.

## 4. Deploy to Vercel

```bash
npm install -g vercel   # if you don't have it already
vercel
```

Or connect the GitHub repo at https://vercel.com/new — Vercel auto-detects
Next.js. Either way, add every `NEXT_PUBLIC_FIREBASE_*` and
`NEXT_PUBLIC_ADMIN_EMAILS` variable from `.env.local` to your Vercel
project's **Settings → Environment Variables**, then redeploy.

Finally, in the Firebase console add your Vercel domain (e.g.
`fitlife.vercel.app`) under **Authentication → Settings → Authorized
domains**, or Google sign-in will be rejected.

## 5. Sending push notifications

Enabling notifications in the app (More → Enable Push Notifications)
generates an FCM device token. To actually send reminders, store that
token against the user's Firestore profile and trigger sends from a
small server (a Cloud Function or any backend with the Firebase Admin
SDK) — the Admin SDK's server-side messaging calls need a service
account key and must never run in the browser.

## Notes on the animated exercise media

Every exercise supports three media modes, set per-exercise from
**Admin → Workouts → Media Type**:

- **Built-in animation** (default) — a lightweight animated illustration,
  works immediately with no upload required.
- **Video URL** — plays an MP4 you host (e.g. on Firebase Storage).
- **Image / GIF URL** — shows a static image or animated GIF.
