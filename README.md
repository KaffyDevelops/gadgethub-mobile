# GadgetHub Mobile

The mobile companion app for the GadgetHub e-commerce website, built with Expo, React Native and TypeScript.

It connects to the **same Supabase project** as the website, so one Google account and one shopping cart work on both web and mobile. When a signed-in user changes their cart on the website, the mobile cart updates in real time without a manual refresh.

## Features

- Sign in with Google (Supabase Auth, same accounts as the website)
- Browse active products from the existing `products` table
- Product details with quantity selection capped at available stock
- Persistent cart stored in the existing `carts` and `cart_items` tables
- Add, increment, decrement, remove and clear cart
- Real-time cart sync through Supabase Realtime
- Session persistence across app restarts
- Account screen with name, email, avatar and a collapsible developer info section

## Tech stack

- Expo (SDK 57), React Native, TypeScript
- Expo Router (file-based navigation)
- `@supabase/supabase-js` (Auth, Postgres Data API, Realtime)
- `expo-web-browser` and `expo-linking` for the OAuth deep link
- `expo-dev-client` and EAS Build for physical-device testing

## Architecture

```
src/
  app/                  Screens (Expo Router)
    _layout.tsx         Providers + root stack
    login.tsx           Google sign-in
    auth/callback.tsx   OAuth deep-link target
    product/[id].tsx    Product details
    (tabs)/             Shop, Cart, Account
  components/           Product card, quantity stepper
  lib/                  Supabase client, money formatter, theme, dev logger
  services/             All Supabase queries (products, cart)
  providers/            Auth and Cart context providers
  types/                Shared TypeScript types
```

Key points:

- **One backend.** No new database, auth system or mock data. The app reads and writes the same tables as the website, and Row Level Security stays enabled.
- **Database as source of truth.** Cart state is never stored locally. Stock is re-read from `products` before every write.
- **Realtime.** After sign-in, the app resolves the user's cart (upsert on `carts.user_id`) and subscribes to `cart_items` changes for that cart. Every event triggers a refetch of the authoritative cart. The channel is removed on logout, cart change and unmount, and the cart also refetches when the app returns to the foreground.
- **DELETE events.** Supabase Realtime cannot filter DELETE events, so the app also listens to unfiltered DELETEs and just refetches. The refetch itself is scoped by RLS.
- **Money** is stored as integer minor units, matching the website. The formatter is in `src/lib/money.ts`.
- **Security.** Only the public Supabase URL and anon key are used in the client. Never put a service-role key, Google client secret, or database password in this app.

## Prerequisites

- Node.js (LTS) and npm
- An Expo account and EAS CLI: `npm install -g eas-cli`
- Access to the GadgetHub Supabase project
- An Android phone (for the development build)
- Google OAuth already enabled in the Supabase project (as for the website)

## Setup

```bash
git clone https://github.com/KaffyDevelops/gadgethub-mobile.git
cd gadgethub-mobile
npm install
cp .env.example .env
```

On Windows PowerShell, use `copy .env.example .env`.

Fill in `.env` with the same values the website uses:

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Find them in Supabase under Project Settings, then API. `.env` is git-ignored.

## Supabase configuration

1. **Redirect URL.** In Authentication, then URL Configuration, add this redirect URL:
```
   gadgethub://**
```
2. **Google provider.** Already enabled for the website. No changes needed.
3. **Realtime.** Enable `public.cart_items` in the `supabase_realtime` publication (Database, then Replication), or run:
```sql
   alter publication supabase_realtime add table public.cart_items;
```

## Deep linking

The custom scheme is `gadgethub`. After Google sign-in, the browser returns to `gadgethub://auth/callback`, and the app completes the session from that URL. Google OAuth does not work reliably in Expo Go, so use a development build.

## Running on a physical Android phone

1. Add the Supabase variables to EAS (the build servers do not see your local `.env`):
```bash
   eas env:create --environment development --name EXPO_PUBLIC_SUPABASE_URL
   eas env:create --environment development --name EXPO_PUBLIC_SUPABASE_ANON_KEY
```
2. Build the development client:
```bash
   eas login
   eas build --profile development --platform android
```
3. When the build finishes (usually 10 to 20 minutes), open the link or scan the QR code on your phone and install the APK.
4. Start the dev server and open the installed GadgetHub app (not Expo Go) on the same Wi-Fi network:
```bash
   npx expo start --dev-client
```

## Manual test checklist

**A. Shared account**
1. Sign in to the GadgetHub website with Google account A and note the email.
2. Sign in to the mobile app with the same account.
3. Confirm the same email appears on the Account tab (Developer info shows the user ID).
4. Confirm the mobile cart shows the same items as the website.

**B. Website to mobile sync**
1. Keep the mobile Cart tab open.
2. Add product X on the website.
3. Confirm product X appears on mobile without refreshing.

**C. Quantity sync**
1. Change a quantity on the website.
2. Confirm the mobile quantity updates automatically.

**D. Removal sync**
1. Remove an item on the website.
2. Confirm it disappears from mobile automatically.

**E. Different users**
1. Sign out on mobile and sign in with Google account B.
2. Confirm account B cannot see account A's cart.

**F. Persistence**
1. Sign in, then close the app completely.
2. Reopen it and confirm you are still signed in with the correct cart.

## Development logging

In development builds the app logs the user ID, cart ID, Realtime channel status and incoming cart event types. Look for `realtime status: SUBSCRIBED` in the Metro terminal. Access and refresh tokens are never logged.

## Troubleshooting

| Problem | Likely cause and fix |
| --- | --- |
| App crashes on launch: missing Supabase variables | The EAS `development` environment is missing the two variables. Add them with `eas env:create` and rebuild. |
| Realtime status `CHANNEL_ERROR` or `TIMED_OUT` | `cart_items` is not in the `supabase_realtime` publication, or Realtime is disabled. |
| Google sign-in returns to a blank screen or fails | `gadgethub://**` is missing from the Supabase redirect URLs, or you are using Expo Go instead of the development build. |
| Empty cart or permission errors | Make sure you are signed in and the RLS policies for `carts` and `cart_items` match the website. |
| TypeScript route errors after adding screens | Run `npx expo start` once to regenerate typed routes, then stop it and run `npx tsc --noEmit`. |
| `EALLOWSCRIPTS` error from `npx expo install` | Run `npm install <package>` directly, then `npx expo install --check`. |
| Phone cannot connect to Metro | The phone and computer must be on the same network. Try `npx expo start --dev-client --tunnel`. |

## Scripts

```bash
npx tsc --noEmit        # type check
npx expo lint           # lint
npx expo start --dev-client   # start Metro for the development build
```

## Status

- TypeScript check passes with no errors.
- A development build has been requested through EAS.
- Google sign-in and real-time cart sync have **not yet been verified** on a physical device. Update this section after completing the test checklist above.

## Out of scope

Mobile checkout, payments and email (Mailgun) are not part of this app. Orders and order items are handled by the website.
