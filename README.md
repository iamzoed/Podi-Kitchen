# States&Swaad

Ordering website for States&Swaad — a home kitchen selling South Indian breakfast (idli, dosa, tiffins, sides, combos, beverages). Customers customize items and check out over WhatsApp; a small admin panel manages the menu.

## Stack

- React + Vite, Tailwind CSS
- [Supabase](https://supabase.com) (Postgres + Auth) for the admin panel and customer accounts — optional; the public menu works from static data in `src/data/menu.js` even without it configured

## Local development

```
npm install
npm run dev
```

## Editing the menu without Supabase

Edit `src/data/menu.js` directly — shop info (WhatsApp number, hours, delivery area, social links) and every menu item live there. Rebuild (`npm run build`) and redeploy to see changes.

## Setting up the admin panel + customer accounts (optional)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase SQL Editor, run `supabase/schema.sql` once — it creates the tables and seeds the current menu.
3. Copy `.env.example` to `.env` and fill in your project's URL and anon/publishable key (Settings → API).
4. Rebuild (`npm run build`).
5. Visit `/admin` on the deployed site, sign up, then in Supabase go to **Table Editor → admins → Insert row** and paste your user id (from **Authentication → Users**) — this is what actually grants admin access, not just having an account.

Once configured, the public site reads live menu data from Supabase (with edits/prices from `/admin` reflected immediately) and customers can optionally sign in to save their details for faster checkout — ordering without an account still works exactly the same.

## Deploying

```
npm run build
```

Drag the resulting `dist` folder into your Netlify site's **Deploys** tab. There's no CI/CD connection — every change requires a fresh build + drag-and-drop.
