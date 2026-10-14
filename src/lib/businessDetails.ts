export const WEEKDAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] as const
export type BusinessHour = {day:typeof WEEKDAYS[number]; status:'open'|'closed'; opens:string; closes:string}
export type BusinessFaq = {question:string; answer:string}
export function validateBusinessDetails(hours:BusinessHour[], faqs:BusinessFaq[]) {
  if (hours.length > 7 || new Set(hours.map(h=>h.day)).size !== hours.length) return 'Use one opening-hours entry per day.'
  for(const h of hours) if(!WEEKDAYS.includes(h.day) || !['open','closed'].includes(h.status) || (h.status === 'open' && (!/^([01]\d|2[0-3]):[0-5]\d$/.test(h.opens) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(h.closes) || h.opens === h.closes))) return 'Enter valid opening and closing times. For overnight hours, set closing earlier than opening.'
  if(faqs.length > 10 || faqs.some(f=>!f.question.trim() || !f.answer.trim() || f.question.length > 200 || f.answer.length > 1500)) return 'Complete each FAQ: up to 200 characters for the question and 1,500 for the answer.'
  return ''
}
