# Gulako search and AI discovery foundation

This upgrade makes individual storefronts and products discoverable without adding a marketplace, a shop directory or cross-shop recommendations.

## Included

- Server-rendered homepage, legal pages, published shops and active products, using the existing React storefront components. The same content is served to browsers and crawlers; no user-agent cloaking.
- Unique canonical URLs, titles, descriptions, Open Graph previews and JSON-LD business/product data. Seller photos are used for image previews when present. Stock and prices come from the same records shown to buyers; no fabricated ratings or reviews.
- Public-data bootstrapping keeps the first browser render populated and avoids fetching the catalog twice. Server queries use the public Supabase key with RLS and an explicit field allowlist. Payment credentials, account records, orders and owner IDs are excluded.
- Live paginated XML sitemap index at `/sitemap.xml`, including only published shops and active products with published parent shops. Each child sitemap fetches at most 500 rows. Shop catalogs are fetched in pages too.
- `robots.txt`, noindex on seller/account/cart/checkout/demo/order pages, real 404 responses for unavailable shops/products, and retryable 503 responses for database failures.
- Seller **Get discovered** page with a real profile-completeness checklist and an illustrative search preview. Completion is not an indexing, ranking or AI recommendation score.
- Actual delivery/pickup information displayed on the storefront and product page.
- Service worker only updates its homepage fallback with the homepage, avoiding accidental reuse of one shop's rendered HTML at other URLs.
- Repaired the existing lockfile, which omitted the declared Supabase dependency and failed `npm ci`.

## Build and test

```sh
npm ci
npm run build
npm run test:discovery
```

The build generates Vite client files in `dist` and the server renderer in `.generated`. Both are build outputs, not tracked source. `api/page.js` requires the generated renderer and `dist/index.html`; `vercel.json` includes them in the function bundle. Existing TikTok API endpoints and static assets retain filesystem routing.

`npm run dev` remains the original client-only Vite development server. To exercise actual server responses, use Vercel preview deployment or the handler integration tests after a build.

## Deployment requirements and remaining verification

The existing Vercel project needs **VITE_API_URL** and **VITE_PUBLIC_TOKEN** in the deployed Functions runtime as well as at build time. These are the existing public Supabase connection variables. Never substitute a service-role key. No new database tables or migrations are required.

Target: existing `TITUS256ug/gulako` repository and `gulako.site` production domain. The previously recorded Vercel project was `gulako-hjum`. The currently connected Vercel team returned project-not-found and no projects matching Gulako. Release was therefore not performed through that account.

Completed locally: TypeScript check, client build, SSR build, and handler integration tests for real server HTML, product schema/price/stock consistency, unpublished/inactive records, 404/503 behavior, private route noindex, sitemap pagination and seller-text escaping. Database responses in tests are fixtures; production database connectivity and RLS are not validated by these tests. A browser binary was unavailable, so browser/mobile visual checks remain pending.

Before promoting a preview on the correct Vercel account:

1. Open a real published shop and product; confirm status 200, correct canonical URL and product details in the raw HTML with JavaScript disabled.
2. Check shopping interactions and the **Get discovered** page at mobile and desktop widths.
3. Open `/sitemap.xml` and its children; confirm real published records and exclusion of unpublished shops/inactive products. Check a missing shop returns 404.
4. Confirm private pages have `X-Robots-Tag: noindex, follow` and static assets/TikTok endpoints still route correctly.
5. Confirm runtime public connection variables are configured and perform a Rich Results Test on representative product/business pages.

After release, the domain owner should verify `gulako.site` in Google Search Console and Bing Webmaster Tools and submit the sitemap. Do not claim submissions or indexing are complete until confirmed by those services. Eligible merchants can connect their storefront URL to their own Google Business Profile. A map link or structured data does not create or verify a Business Profile.

## Follow-on development

- Optional structured address, opening hours and service-area fields; publish only merchant-confirmed facts.
- Merchant-editable FAQs and product-description assistance, with review before publishing.
- Referral and order-conversion reporting using real measurements. AI visibility cannot be inferred from a profile checklist, and not all AI referrals carry attribution.
- Search Console integration after domain ownership and account access are established.

## Guidance

- Google: https://developers.google.com/search/docs/appearance/ai-features
- Local business data: https://developers.google.com/search/docs/appearance/structured-data/local-business

Google says normal SEO foundations apply to AI Overviews and AI Mode; no special AI file or schema is required. Good content and crawlability improve eligibility but never guarantee indexing, rankings, traffic or AI citations.
