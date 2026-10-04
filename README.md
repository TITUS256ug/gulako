# Gulako — modern full prototype

Fresh Gulako PWA frontend prototype.

## Locked pricing baseline
- Free — UGX 0: up to 20 active products, unlimited orders
- Pro — UGX 20,000/month: up to 250 products, unlimited orders
- Business — UGX 50,000/month: unlimited products and unlimited orders, including AI business tools

## Important: clean install for this fixed build
Open PowerShell in this folder and run:

```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
npm install
npm run dev
```

Then open the URL shown by Vite, normally http://127.0.0.1:5173/

The app now includes a startup diagnostic. If a module fails, Gulako shows the error on the page instead of an unexplained white screen.

## Main routes
- `/` — homepage + pricing
- `/explore` — marketplace discovery
- `/signin` — sign in with Google/Gmail, TikTok, phone or email
- `/signup` — seller sign up
- `/onboarding` — seller onboarding
- `/shop/nile-ai-solutions` — sample public shop
- `/product/studio-headphones` — sample product
- `/cart` — cart
- `/checkout` — guest checkout
- `/order/GLK-2420` — order tracking
- `/dashboard` — seller dashboard
- `/dashboard/products`
- `/dashboard/orders`
- `/dashboard/customers`
- `/dashboard/analytics`
- `/dashboard/store`
- `/dashboard/settings`

Authentication and persistence are still demo flows until Supabase is connected.
