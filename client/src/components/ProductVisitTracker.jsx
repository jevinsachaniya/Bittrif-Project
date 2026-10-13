import { useEffect, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import axios from 'axios'
import { CheckCircle2, LoaderCircle, MessageCircle, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { API } from '../lib/utils'

const SESSION_KEY = 'nivora_product_visitor'
const PROMPT_KEY = 'nivora_visitor_prompt_seen'
const CONTACT_KEY = 'nivora_visitor_contact'

function readSession(key) {
  try { return sessionStorage.getItem(key) } catch { return null }
}

function writeSession(key, value) {
  try { sessionStorage.setItem(key, value) } catch { /* Browsing also works without storage. */ }
}

function persistentVisitorId() {
  let existing
  try { existing = localStorage.getItem(SESSION_KEY) } catch { /* Use session storage as a fallback. */ }
  const id = existing || readSession(SESSION_KEY) || newVisitId()
  try { localStorage.setItem(SESSION_KEY, id) } catch { /* Browsing also works without persistent storage. */ }
  writeSession(SESSION_KEY, id)
  return id
}

function savedContact() {
  try { return JSON.parse(readSession(CONTACT_KEY) || 'null') } catch { return null }
}

function newVisitId() {
  if (crypto.randomUUID) return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 15) | 64
  bytes[8] = (bytes[8] & 63) | 128
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export default function ProductVisitTracker({ product }) {
  const { user, logout } = useAuth()
  const token = user?.token
  const [visitorId] = useState(persistentVisitorId)
  const [visitKey] = useState(() => newVisitId())
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const visitRequest = useRef(null)

  const recordVisit = () => axios.post(`${API}/product-visits`, {
    product_id: product.id, visit_key: visitKey, visitor_id: visitorId,
  }, token ? { headers: { Authorization: `Bearer ${token}` } } : {})

  useEffect(() => {
    let active = true
    const request = axios.post(`${API}/product-visits`, {
      product_id: product.id, visit_key: visitKey, visitor_id: visitorId,
    }, token ? { headers: { Authorization: `Bearer ${token}` } } : {})
    visitRequest.current = request
    request.then(() => {
      const contact = savedContact()
      if (!token && contact && active) {
        return axios.put(`${API}/product-visits/${visitKey}/contact`, { ...contact, visitor_id: visitorId })
      }
    }).catch((requestError) => {
      if (active && token && requestError.response?.status === 401) logout()
      // Other tracking failures must not interrupt shopping.
    })

    let timer
    if (!token && !savedContact() && !readSession(PROMPT_KEY)) {
      timer = window.setTimeout(() => {
        writeSession(PROMPT_KEY, '1')
        setOpen(true)
      }, 5000)
    }
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [product.id, token, visitKey, visitorId, logout])

  const submit = async (event) => {
    event.preventDefault()
    const contact = { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() }
    if (contact.name.length < 2 || (!contact.email && !contact.phone)) {
      setError('Please enter your name and an email address or phone number. You can also choose Skip.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await (visitRequest.current || recordVisit()).catch(() => recordVisit())
      await axios.put(`${API}/product-visits/${visitKey}/contact`, { ...contact, visitor_id: visitorId })
      writeSession(CONTACT_KEY, JSON.stringify(contact))
      setSuccess(true)
    } catch (submitError) {
      const detail = submitError.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Unable to save your details. Please try again or choose Skip.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-slate-950/55 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[101] max-h-[90dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
          <Dialog.Close aria-label="Close contact dialogue" className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></Dialog.Close>
          <span className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-700">{success ? <CheckCircle2 size={25} /> : <MessageCircle size={25} />}</span>
          <Dialog.Title className="pr-6 font-display text-2xl font-bold text-slate-900">{success ? 'Thank you for sharing!' : 'Interested in this product?'}</Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-6 text-slate-600">
            {success ? 'Your details have been shared with our team.' : `Share your details so our team can help with ${product.name}. This is optional; you can skip and keep browsing.`}
          </Dialog.Description>
          {success ? <Dialog.Close className="btn-primary mt-6 w-full justify-center">Continue browsing</Dialog.Close> : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div><label htmlFor="visitor-name" className="mb-1.5 block text-sm font-semibold text-slate-700">Name</label><input id="visitor-name" autoComplete="name" className="input" maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name" /></div>
              <div><label htmlFor="visitor-email" className="mb-1.5 block text-sm font-semibold text-slate-700">Email address</label><input id="visitor-email" type="email" autoComplete="email" className="input" maxLength={254} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></div>
              <div><label htmlFor="visitor-phone" className="mb-1.5 block text-sm font-semibold text-slate-700">Phone number</label><input id="visitor-phone" type="tel" autoComplete="tel" className="input" maxLength={30} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Your phone number" /></div>
              <p className="text-xs leading-5 text-slate-500">Provide either email or phone if you choose to share. By submitting, you agree that our team may contact you about your product interest.</p>
              {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              <button type="submit" disabled={saving} className="btn-primary w-full justify-center gap-2 disabled:opacity-60">{saving && <LoaderCircle size={17} className="animate-spin" />}{saving ? 'Saving...' : 'Share details'}</button>
              <Dialog.Close className="w-full rounded-lg py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50">Skip for now</Dialog.Close>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
