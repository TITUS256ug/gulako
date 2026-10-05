import { Footer } from '../components/Footer'
import { Header } from '../components/Header'

export function TermsPage(){
  return <div className="app-shell legal-page"><Header compact/><main className="page-container legal-main">
    <section className="legal-hero"><span className="section-kicker">Gulako legal</span><h1>Terms of Service</h1><p>Effective October 5, 2026</p></section>
    <article className="legal-card">
      <h2>1. About Gulako</h2>
      <p>Gulako is a digital storefront platform operated by Nile AI Solutions. It helps businesses publish products, share a shop link, receive customer orders, communicate with customers and use business tools.</p>
      <h2>2. Seller accounts</h2>
      <p>Sellers are responsible for accurate business, product, pricing, contact and payment information. You must keep your account secure and use Gulako only for lawful business activity.</p>
      <h2>3. Products and transactions</h2>
      <p>Gulako provides storefront and ordering tools. Unless a separate payment service is introduced, payments are made directly between customers and sellers using the payment details shown by the seller. Sellers are responsible for fulfilment, refunds, delivery, taxes and product compliance.</p>
      <h2>4. Plans and billing</h2>
      <p>Free, Pro and Business plans may have different features and limits. Paid-plan prices and features are shown inside Gulako. Manual Mobile Money or bank-transfer upgrade requests may require review before activation.</p>
      <h2>5. Acceptable use</h2>
      <p>You may not use Gulako to sell illegal goods, commit fraud, impersonate others, distribute malware, abuse customers or violate applicable laws or third-party rights.</p>
      <h2>6. Availability</h2>
      <p>We work to keep Gulako reliable, but uninterrupted availability is not guaranteed. Features may change as the service improves.</p>
      <h2>7. Account suspension</h2>
      <p>We may restrict or suspend accounts that violate these terms, create security risks or misuse the platform.</p>
      <h2>8. Contact</h2>
      <p>Questions about these terms can be sent to <a href="mailto:emails@nileai.solutions">emails@nileai.solutions</a>.</p>
    </article>
  </main><Footer/></div>
}

export function PrivacyPage(){
  return <div className="app-shell legal-page"><Header compact/><main className="page-container legal-main">
    <section className="legal-hero"><span className="section-kicker">Gulako legal</span><h1>Privacy Policy</h1><p>Effective October 5, 2026</p></section>
    <article className="legal-card">
      <h2>1. Information we collect</h2>
      <p>We collect information you provide when creating or operating a Gulako account, including your name, email address, business details, product information, shop settings and contact information.</p>
      <h2>2. Social sign-in</h2>
      <p>If you choose Google or TikTok sign-in, Gulako may receive basic account information permitted by the provider, such as your name, email address where available, profile identifier and profile image. We request only the information needed to sign you in and operate your account.</p>
      <h2>3. How we use information</h2>
      <p>We use information to authenticate users, operate storefronts, save products, process orders, provide analytics, support sellers, prevent abuse and improve Gulako.</p>
      <h2>4. Payments</h2>
      <p>Gulako may display seller or Gulako merchant and bank details for direct payment. Gulako does not ask customers for Mobile Money PINs, banking passwords or OTPs.</p>
      <h2>5. Storage and service providers</h2>
      <p>Gulako uses service providers such as Supabase and Vercel to host authentication, databases, storage and the application. These providers process information as needed to deliver the service.</p>
      <h2>6. Browser storage</h2>
      <p>Gulako may use local browser storage to remember settings such as theme, cart contents and temporary app preferences.</p>
      <h2>7. Sharing</h2>
      <p>We do not sell personal information. Information may be shared with service providers that help operate Gulako, or when required by law.</p>
      <h2>8. Your choices</h2>
      <p>You may contact us to request access, correction or deletion of personal information associated with your Gulako account, subject to legal and operational requirements.</p>
      <h2>9. Contact</h2>
      <p>Privacy questions can be sent to <a href="mailto:emails@nileai.solutions">emails@nileai.solutions</a>.</p>
    </article>
  </main><Footer/></div>
}
