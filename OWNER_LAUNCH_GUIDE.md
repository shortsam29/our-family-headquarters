# Our Family Headquarters — Owner Launch Guide

## Run locally

1. Install Node.js 20 or newer.
2. Open the repository and run `npm install`.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to `.env.local`.
4. Run `npm run dev`, then open `http://localhost:3000`.

## Deploy

1. Connect the GitHub repository to Vercel.
2. Add the two public Supabase environment variables in the deployment settings.
3. Add the production URL to Supabase Authentication redirect URLs.
4. Apply pending migrations with `npx supabase db push`.
5. Deploy from the reviewed production branch. Never expose a service-role key to the application.

## Update

Pull the reviewed branch, run `npm install` when dependencies changed, apply pending migrations, run the validation commands, then deploy. Migrations are forward-only; do not rewrite applied migrations.

## Back up and restore

- Use scheduled Supabase backups when available for the project plan.
- Before a material migration, create a database dump with the Supabase CLI and export private Storage objects through an authorized owner process.
- Restore into a separate recovery project first, validate household isolation, then schedule the production restore. Never test restoration against the only live copy.

## Manage Supabase

Keep the project linked only to the intended environment. Apply migrations from `supabase/migrations`, keep `.env.local` private, review Authentication redirect URLs, monitor database and Storage usage, and periodically repeat the repository’s RLS verification scripts.

## Create the first household

Sign in with the first administrator account. The application opens the setup wizard automatically. Enter the household name, administrator display name, and household time zone, then finish the guided checklist in Settings.

## Add family members

Open **Family Hub → Manage family members**. Add a profile, choose the correct role, and keep inactive profiles instead of reusing identities. Email invitations remain a future integration; profiles can be managed manually now.

## Install the PWA

- **iPhone:** Open the production site in Safari, tap **Share**, choose **Add to Home Screen**, then confirm **Add**.
- **Android:** Open the site in Chrome, open the menu, choose **Install app** or **Add to Home screen**, then confirm.
- **Windows:** Open the site in Edge or Chrome, select the install icon in the address bar, then choose **Install**.
- **Mac:** In Safari, choose **File → Add to Dock** where supported. In Chrome, use **Install Our Family Headquarters** from the address bar or menu.

## Manage Family Vault

Only upload household files the signed-in member is permitted to manage. Choose the correct category and visibility, add expiration dates when helpful, and use **Replace** to preserve the record’s purpose. Deleted files are removed from private Storage; maintain external backups for irreplaceable originals.

## Maintain Kenzie preferences

Open **Kenzie → Family Preferences**. Parents can adjust greeting, reminder, planning, and domain reminder settings. Keep Household Memory accurate and remove outdated notes. Kenzie recommends and prepares proposals; she never changes household records without explicit approval.

## Future integrations

Live weather, email invitations, push notifications, external calendars, banking synchronization, and paid AI remain isolated extension points. Add providers only after privacy, cost, permissions, retention, and failure behavior are approved.
