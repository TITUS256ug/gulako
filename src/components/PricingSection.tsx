import { Check, Sparkles } from 'lucide-react'
import { pricing } from '../data/mock'

export function PricingSection({ compact = false }: { compact?: boolean }) {
  return (
    <section className={compact ? 'pricing-section compact-section' : 'pricing-section'} id="pricing">
      <div className="section-heading centered">
        <span className="section-kicker"><Sparkles size={15} /> Simple plans</span>
        <h2>Start free. Grow when you’re ready.</h2>
      </div>
      <div className="pricing-grid">
        {pricing.map(plan => (
          <article className={plan.featured ? 'pricing-card featured' : 'pricing-card'} key={plan.name}>
            {plan.featured && <span className="popular-pill">Most popular</span>}
            <p className="plan-name">{plan.name}</p>
            <div className="plan-price">{plan.price}<small>{plan.suffix}</small></div>
            <p className="plan-note">{plan.note}</p>
            <div className="plan-features">
              {plan.features.map(feature => <span key={feature}><Check size={16} /> {feature}</span>)}
            </div>
            <a className={plan.featured ? 'primary-button full-width' : 'soft-button full-width'} href="/signup">
              {plan.name === 'Free' ? 'Start free' : `Choose ${plan.name}`}
            </a>
          </article>
        ))}
      </div>
    </section>
  )
}
