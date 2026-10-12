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

The existing Vercel project needs **VITE_API_URL** and **VITE_PUBLIC_TOKEN** in the deployed Functions runtime as well as at build time. These are the existing public Supabase connection variables. Never substitute a service-role key. The SEO foundation alone requires no database migration; the growth release below does.

SEO foundation is deployed to production at `https://gulako.site` from main commit `8a57f2d82bd077d4b653867f9baac5c5f4f9de93` (Vercel deployment `dpl_8GZGkwihZbS5iJFdm1fBUik9tFYr`). Verified homepage and sitemap HTTP 200, missing shop HTTP 404, private dashboard noindex, and browser homepage rendering.

The growth release below is separate and MUST NOT be promoted until its migration is applied. Gulako's database is `ydslkdrbcthhjclzgrqa`; the current Supabase connection exposes only NileFlow and Nile Core and cannot administer Gulako. Do not change the application to either unrelated project.

After release, the domain owner should verify `gulako.site` in Google Search Console and Bing Webmaster Tools and submit the sitemap. Do not claim submissions or indexing are complete until confirmed by those services. Eligible merchants can connect their storefront URL to their own Google Business Profile. A map link or structured data does not create or verify a Business Profile.

## Business growth release

- Merchant-edited FAQs and opening hours, with timezone, closed days and overnight hours; both render in public server HTML. Opening hours also populate business structured data. No invented business facts or FAQ rich-result promises.
- AI-assisted product descriptions through Vercel AI Gateway (`openai/gpt-5.4-nano`, optional `AI_GATEWAY_MODEL` override). Seller authentication and persistent 20 requests/day quota. Only supplied facts; editable draft requires seller review and explicit use/save. The existing Vercel deployment OIDC identity supplies Gateway authentication; live access and credits still require verification.
- Fresh session/event tracking with first-touch coarse source and campaign, server-side order linkage, owner-only reports and owner-preview exclusions. DNT and automated browsers skipped. Historical seeded views do not populate reports. Checkout awaits a bounded tracking request; analytics failure never prevents the order itself. Missing referrers, blocked tracking and WhatsApp-only purchases remain unmeasured. Session conversion uses sessions with orders, not orders divided by seeded visits. Completed value reflects seller status, not verified payment.

### Required rollout order

1. Connect the Supabase account with permission to Gulako project `ydslkdrbcthhjclzgrqa` and inspect the actual orders schema/function against the repository baseline.
2. Apply `supabase/migrations/20261012120522_gulako_business_growth.sql` there using the migration tool. It adds shop fields, RLS-protected visits/events/AI quota and attributed-order/reporting RPCs. It preserves the original order function for the current production frontend. Do not deploy the frontend first: public server queries require the new columns.
3. Verify database policies/advisors and seller/anonymous RPC behavior on the real project. Local PostgreSQL tests use isolated fixture tables and a stub original order function, so they cannot confirm live schema compatibility.
4. Deploy this branch to preview with the existing public database variables and check seller settings, a product draft and storefront on desktop/mobile. Verify authenticated AI generation and Gateway credits before promotion. Use explicitly disposable test-shop orders for end-to-end checkout verification.
5. Merge to main; Vercel Git integration deploys production. Recheck SSR, sitemap, checkout and actual report linkage. No full growth production rollout has occurred yet.

### Verification

`npm run build`, `npm run test:discovery`, `npm run test:growth`.

Growth tests run isolated PostgreSQL via PGlite: migration application, invalid business fields, overnight hours, event retries, anonymous write boundaries, cross-shop and expired attribution, owner exclusion/read isolation, persistent AI quota, and AI endpoint request rejection. Discovery tests cover SSR FAQs/hours as well as the original discovery foundation. Live authenticated seller/mobile interactions and real AI output remain unverified because the required backend is not connected.

### Recommended next increments

Merchant-entered return/exchange policies and service areas; product variants and low-stock alerts; genuine post-order reviews with moderation; payment verification before claiming paid revenue; consent-based customer follow-up; domain ownership verification and Search Console reporting. Preserve independent shops without cross-shop advertising or a marketplace directory.

## Guidance

- Google: https://developers.google.com/search/docs/appearance/ai-features
- Local business data: https://developers.google.com/search/docs/appearance/structured-data/local-business

Google says normal SEO foundations apply to AI Overviews and AI Mode; no special AI file or schema is required. Good content and crawlability improve eligibility but never guarantee indexing, rankings, traffic or AI citations.
