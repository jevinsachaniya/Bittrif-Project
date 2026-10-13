import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Reveal } from './SiteExperience'

const questions = [
  { title: 'How do I place an order?', answer: <>Explore the collection, choose a product, and add it to your bag. You can review quantities before continuing to checkout. Any minimum order quantity is shown on the product page.</> },
  { title: 'Can you help with a larger order?', answer: <>Of course. Use “Get a quote” on any product to send our team the item you’re interested in. Include your quantity and any specific requirements so we can help you find the right fit.</> },
  { title: 'Where can I find my order updates?', answer: <>Sign in and visit <Link to="/my-orders" className="font-semibold text-brand-800 underline underline-offset-4">My orders</Link> to see your order status. For more help, email us with your order number and the email address used at checkout.</> },
  { title: 'What if I have a question about a product?', answer: <>Select “Get a quote” on its product page, or email hello@nivoramart.in. Share the product name and your question, and we’ll help with details and availability.</> },
]

export default function HelpAccordion() {
  const [open, setOpen] = useState(null)
  return <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-6 lg:px-8"><Reveal className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]"><div><p className="section-kicker">Good to know</p><h2 className="section-title mt-3">A few little answers.</h2><p className="mt-4 max-w-xs text-sm leading-7 text-slate-500">From your first find to your next order, we’re here to make things simple.</p></div><div className="border-t border-brand-200">{questions.map((question, index) => <div key={question.title} className="border-b border-brand-200"><h3><button id={'faq-button-' + index} className="flex w-full items-center justify-between gap-5 py-6 text-left text-sm font-semibold text-brand-950" onClick={() => setOpen(open === index ? null : index)} aria-expanded={open === index} aria-controls={'faq-panel-' + index}>{question.title}<motion.span animate={{ rotate: open === index ? 45 : 0 }} className="shrink-0"><Plus size={19} /></motion.span></button></h3><AnimatePresence initial={false}>{open === index && <motion.div id={'faq-panel-' + index} role="region" aria-labelledby={'faq-button-' + index} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .25 }} className="overflow-hidden"><p className="pb-6 pr-7 text-sm leading-7 text-slate-600">{question.answer}</p></motion.div>}</AnimatePresence></div>)}</div></Reveal></section>
}
