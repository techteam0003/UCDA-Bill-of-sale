# Supabase Setup Guide

## 1. Create the Supabase project
1. Go to https://supabase.com → **Start your project** → sign in with GitHub.
2. **New project** → name it `ucda-bill-of-sale`, set a strong database password (save it), choose a region close to Ontario (e.g. *Canada (Central)* or *East US*).
3. Wait ~2 minutes for it to finish setting up.

## 2. Create the tables, storage and starting sellers
1. In the left menu open **SQL Editor** → **New query**.
2. Open `supabase/setup.sql` from this project, copy ALL of it, paste it in, click **Run**.
3. You should see "Success. No rows returned".
4. Check **Table Editor** → you should see `sellers` (with 2 rows) and `bills`.

## 3. Lock down sign-ups and create user accounts
The app has no sign-up page on purpose — only people you add can log in.
1. **Authentication → Sign In / Providers** → under *User Signups* turn **OFF** "Allow new users to sign up" → Save.
2. **Authentication → Users → Add user → Create new user** → enter email + password, tick **Auto Confirm User** → Create.
3. Repeat for each person who needs access.

## 4. Copy your API keys
**Project Settings → API Keys** (and **Data API** for the URL). You need:
- **Project URL** – looks like `https://abcdxyz.supabase.co`
- **Publishable key** (or the legacy **anon public** key)

Never use the `service_role` / secret key in this app.

## 5. Connect the app locally
1. In the project folder, copy `.env.example` → rename the copy to `.env.local`.
2. Fill in:
   ```
   VITE_SUPABASE_URL=https://abcdxyz.supabase.co
   VITE_SUPABASE_ANON_KEY=your-publishable-key
   ```
3. Run `npm install` then `npm run dev` → open http://localhost:5173 → sign in.

`.env.local` is in `.gitignore`, so it is never uploaded to GitHub.

## 6. Connect the live site on Render
1. Render → your static site → **Environment** → **Add Environment Variable**, add both:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. Save → **Manual Deploy → Clear build cache & deploy** (the keys are built into the site, so a redeploy is required).

## 7. Push the code
```bash
git add .
git commit -m "Connect Supabase database"
git push
```

## What's stored where
| Data | Location |
|---|---|
| Sellers | `sellers` table |
| Uploaded signatures | `signatures` storage bucket (private) |
| Every saved bill (all form fields + seller details) | `bills` table |
| Bill PDFs | `bills` storage bucket (private) |

The two starting sellers use the signature files in `public/signatures/`.
Only logged-in users can read or write anything (Row Level Security).
