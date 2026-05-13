# Subscription Simulation Design

## Goal

After a user logs in or registers, the app should send them to a subscription page before they can access the dashboard. Because this is a simulation, subscription state is stored in the browser with `localStorage`, scoped to each Supabase user id.

## Scope

In scope:

- Add a protected `/subscription` page.
- Redirect successful login and immediate-session registration to `/subscription`.
- Block dashboard routes until the current user has subscribed.
- Store simulated subscription state in `localStorage`.
- Redirect already subscribed users away from `/subscription` to `/dashboard`.

Out of scope:

- Payment gateway integration.
- Supabase subscription table or database schema changes.
- Server-side enforcement of subscription status.

## User Flow

1. User opens `/auth` and logs in or registers.
2. App redirects the user to `/subscription`.
3. The subscription page presents a simple package selection and a subscribe button.
4. When the user clicks subscribe, the app stores a local subscription flag for the authenticated user.
5. App redirects the user to `/dashboard`.
6. Future dashboard visits in the same browser are allowed for that user.

## Architecture

`src/App.jsx` owns route-level access checks. It already loads the Supabase session, so it will also derive whether the current session user has a simulated subscription.

Add a small localStorage helper inside `App.jsx` or a nearby lightweight utility:

- Key format: `tpq_subscription_<userId>`.
- Value: `"active"`.
- Read returns `true` only when the value is `"active"`.

Add two route wrappers:

- Existing authenticated route behavior remains responsible for login checks.
- Dashboard routes also require the subscription flag. If missing, they redirect to `/subscription`.

`src/pages/SubscriptionPage.jsx` handles the subscription simulation. It receives the current session or user id through route context props, stores the flag, and navigates to `/dashboard`.

## UI Design

The subscription page should match the TPQ visual language already used in the auth and dashboard screens:

- Green/yellow brand accents from Tailwind theme.
- Clean responsive layout.
- A short headline explaining that dashboard access requires subscription.
- One recommended demo package card.
- A visible "Subscribe Sekarang" action.
- A secondary sign-out action so users are not trapped on the page.

## Error Handling

- If session is still loading, show the existing full-screen loading state.
- If there is no session, redirect to `/auth`.
- If `localStorage` is unavailable, show a friendly error on subscribe and keep the user on `/subscription`.
- If a subscribed user opens `/subscription`, redirect to `/dashboard`.

## Testing

Manual verification:

- Login redirects to `/subscription`.
- Register with an immediate session redirects to `/subscription`.
- Direct `/dashboard` access while logged in but unsubscribed redirects to `/subscription`.
- Clicking subscribe redirects to `/dashboard`.
- Refreshing `/dashboard` after subscribing stays on dashboard.
- Opening `/subscription` after subscribing redirects to dashboard.
- Signing out returns to `/auth`.

