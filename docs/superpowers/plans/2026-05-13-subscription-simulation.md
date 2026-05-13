# Subscription Simulation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a simulated subscription gate so logged-in users must visit `/subscription` and click subscribe before accessing dashboard routes.

**Architecture:** Keep subscription state client-side in `localStorage`, scoped by Supabase user id. Route wrappers in `src/App.jsx` enforce authentication and subscription checks, while `src/pages/SubscriptionPage.jsx` owns the simulated subscription UI and action.

**Tech Stack:** React 19, React Router 7, Vite, Tailwind CSS, Supabase Auth, browser `localStorage`.

---

## File Structure

- Create `src/lib/subscription.js`: small pure helper for reading and writing the simulated subscription flag.
- Create `src/pages/SubscriptionPage.jsx`: responsive subscription page with package card, subscribe action, error state, and sign-out action.
- Modify `src/App.jsx`: import subscription helper and page, track `hasSubscription`, add `/subscription`, and protect dashboard routes.
- Modify `src/pages/AuthPage.jsx`: redirect login and immediate-session registration to `/subscription`.

## Task 1: Add Local Subscription Helper

**Files:**
- Create: `src/lib/subscription.js`

- [ ] **Step 1: Create helper module**

Add this file:

```js
const SUBSCRIPTION_VALUE = 'active';

export const getSubscriptionStorageKey = (userId) => `tpq_subscription_${userId}`;

export const hasActiveSubscription = (userId) => {
  if (!userId || typeof window === 'undefined') return false;

  try {
    return window.localStorage.getItem(getSubscriptionStorageKey(userId)) === SUBSCRIPTION_VALUE;
  } catch {
    return false;
  }
};

export const activateSubscription = (userId) => {
  if (!userId || typeof window === 'undefined') {
    throw new Error('User belum tersedia untuk subscription.');
  }

  window.localStorage.setItem(getSubscriptionStorageKey(userId), SUBSCRIPTION_VALUE);
};
```

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: either PASS, or only pre-existing lint errors unrelated to `src/lib/subscription.js`.

- [ ] **Step 3: Commit**

Run:

```bash
git add src/lib/subscription.js
git commit -m "feat: add simulated subscription storage"
```

## Task 2: Add Subscription Page

**Files:**
- Create: `src/pages/SubscriptionPage.jsx`

- [ ] **Step 1: Create page component**

Add this file:

```jsx
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { activateSubscription } from '../lib/subscription';

const SubscriptionPage = ({ session, hasSubscription, onSubscriptionChange }) => {
  const navigate = useNavigate();
  const [subscribing, setSubscribing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
        Memuat...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (hasSubscription) {
    return <Navigate to="/dashboard" replace />;
  }

  const userName = session.user?.user_metadata?.full_name || session.user?.email || 'Pengguna';

  const handleSubscribe = () => {
    setSubscribing(true);
    setError('');

    try {
      activateSubscription(session.user.id);
      onSubscriptionChange?.(true);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Subscription belum bisa diproses. Silakan coba lagi.');
      setSubscribing(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    navigate('/auth', { replace: true });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/50 px-5 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-tpq-green transition hover:text-tpq-light">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-tpq-green text-white">TPQ</span>
            Athir TPQ
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-tpq-green hover:text-tpq-green disabled:opacity-60"
          >
            {signingOut ? 'Keluar...' : 'Keluar'}
          </button>
        </header>

        <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[1fr_420px]">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-tpq-light">
              Subscription Demo
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl">
              Aktifkan akses dashboard TPQ Anda.
            </h1>
            <p className="mt-5 text-base leading-8 text-gray-600">
              Halo, {userName}. Untuk simulasi alur berlangganan, aktifkan paket terlebih dahulu sebelum masuk ke dashboard pengelolaan santri, absensi, dan nilai ngaji.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                ['Data Santri', 'Kelola profil dan status santri aktif.'],
                ['Absensi', 'Catat kehadiran harian dengan cepat.'],
                ['Nilai Ngaji', 'Pantau progres bacaan setiap santri.'],
              ].map(([title, description]) => (
                <div key={title} className="rounded-lg border border-emerald-100 bg-white p-4 shadow-sm">
                  <p className="text-sm font-bold text-gray-900">{title}</p>
                  <p className="mt-2 text-xs leading-5 text-gray-500">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl shadow-emerald-900/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-tpq-light">Paket Rekomendasi</p>
                <h2 className="mt-2 text-2xl font-bold text-gray-950">TPQ Pro</h2>
              </div>
              <span className="rounded-full bg-tpq-yellow/20 px-3 py-1 text-xs font-bold text-tpq-green">
                Demo
              </span>
            </div>

            <div className="mt-6 flex items-end gap-2">
              <span className="text-4xl font-bold text-gray-950">Rp0</span>
              <span className="pb-1 text-sm text-gray-500">/ simulasi</span>
            </div>

            <ul className="mt-6 space-y-3 text-sm text-gray-600">
              {[
                'Akses dashboard manajemen TPQ',
                'Kelola data santri dan kelompok',
                'Input absensi dan nilai ngaji',
                'Status tersimpan di browser ini',
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-tpq-green">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {error && (
              <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleSubscribe}
              disabled={subscribing || signingOut}
              className="mt-6 w-full rounded-xl bg-tpq-green px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-tpq-green/20 transition hover:bg-tpq-light disabled:opacity-60"
            >
              {subscribing ? 'Memproses...' : 'Subscribe Sekarang'}
            </button>

            <p className="mt-4 text-center text-xs leading-5 text-gray-400">
              Ini hanya simulasi. Tidak ada pembayaran atau perubahan database.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default SubscriptionPage;
```

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: PASS, or only pre-existing lint errors unrelated to `src/pages/SubscriptionPage.jsx`.

- [ ] **Step 3: Commit**

Run:

```bash
git add src/pages/SubscriptionPage.jsx
git commit -m "feat: add subscription simulation page"
```

## Task 3: Add Subscription Route Guards

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Update imports**

Change imports at the top of `src/App.jsx` to include:

```jsx
import SubscriptionPage from './pages/SubscriptionPage';
import { hasActiveSubscription } from './lib/subscription';
```

- [ ] **Step 2: Add subscription-aware protected route**

Replace `ProtectedRoute` with:

```jsx
const ProtectedRoute = ({ session, requiresSubscription = false, hasSubscription = false, children }) => {
  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
        Memuat...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (requiresSubscription && !hasSubscription) {
    return <Navigate to="/subscription" replace />;
  }

  return children;
};
```

- [ ] **Step 3: Track subscription state**

Inside `App`, add state and update session handling:

```jsx
const [session, setSession] = useState(undefined);
const [hasSubscription, setHasSubscription] = useState(false);
```

In `getSession().then`, set both session and subscription:

```jsx
supabase.auth.getSession().then(({ data }) => {
  if (isMounted) {
    setSession(data.session);
    setHasSubscription(hasActiveSubscription(data.session?.user?.id));
  }
});
```

In `onAuthStateChange`, set both:

```jsx
supabase.auth.onAuthStateChange((_event, newSession) => {
  setSession(newSession);
  setHasSubscription(hasActiveSubscription(newSession?.user?.id));
});
```

- [ ] **Step 4: Add `/subscription` route**

Add this route after `/auth`:

```jsx
<Route
  path="/subscription"
  element={
    <SubscriptionPage
      session={session}
      hasSubscription={hasSubscription}
      onSubscriptionChange={setHasSubscription}
    />
  }
/>
```

- [ ] **Step 5: Require subscription for dashboard routes**

Update both dashboard routes:

```jsx
<ProtectedRoute session={session} requiresSubscription hasSubscription={hasSubscription}>
  <DashboardPage />
</ProtectedRoute>
```

```jsx
<ProtectedRoute session={session} requiresSubscription hasSubscription={hasSubscription}>
  <SantriNilaiPage />
</ProtectedRoute>
```

- [ ] **Step 6: Run build**

Run: `npm run build`

Expected: Vite build completes successfully.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/App.jsx
git commit -m "feat: guard dashboard behind subscription"
```

## Task 4: Redirect Auth Success To Subscription

**Files:**
- Modify: `src/pages/AuthPage.jsx`

- [ ] **Step 1: Update registration redirect**

Change:

```jsx
navigate('/dashboard', { replace: true });
```

inside the immediate-session registration branch to:

```jsx
navigate('/subscription', { replace: true });
```

- [ ] **Step 2: Update login redirect**

Change:

```jsx
navigate('/dashboard', { replace: true });
```

after successful password login to:

```jsx
navigate('/subscription', { replace: true });
```

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: Vite build completes successfully.

- [ ] **Step 4: Commit**

Run:

```bash
git add src/pages/AuthPage.jsx
git commit -m "feat: redirect auth success to subscription"
```

## Task 5: Manual Flow Verification

**Files:**
- No file changes expected.

- [ ] **Step 1: Start dev server**

Run: `npm run dev -- --host 127.0.0.1`

Expected: Vite prints a local URL.

- [ ] **Step 2: Verify unsubscribed guard**

Open the local URL, sign in, and confirm successful auth lands on `/subscription`. Open `/dashboard` manually while unsubscribed and confirm it redirects back to `/subscription`.

- [ ] **Step 3: Verify subscribe flow**

Click `Subscribe Sekarang`. Expected: app redirects to `/dashboard`.

- [ ] **Step 4: Verify persisted local simulation**

Refresh `/dashboard`. Expected: the dashboard remains accessible because `localStorage` has `tpq_subscription_<userId>` set to `active`.

- [ ] **Step 5: Verify subscribed route behavior**

Open `/subscription` after subscribing. Expected: it redirects to `/dashboard`.

- [ ] **Step 6: Final status check**

Run:

```bash
git status --short
```

Expected: no unexpected modified files. If the implementation commits were made, only unrelated pre-existing user changes may remain.

