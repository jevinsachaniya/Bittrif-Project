import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Loader, Lock, Mail, ShieldCheck } from 'lucide-react'
import Logo from '../components/Logo'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirect = new URLSearchParams(location.search).get('redirect') || '/'

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const updateField = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(form.email, form.password)
      navigate(redirect)
    } catch (submitError) {
      setError(submitError.response?.data?.detail || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell min-h-screen bg-[linear-gradient(180deg,_rgba(249,115,22,0.10),_transparent_28rem)]">
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="hidden rounded-[2rem] bg-brand-950 p-10 text-white lg:block">
          <Logo white size="lg" />
          <p className="section-kicker mt-10 text-gold-400">Account access</p>
          <h1 className="mt-4 font-display text-5xl font-bold tracking-tight">Welcome back to your Nivora account.</h1>
          <p className="mt-5 max-w-lg text-base leading-8 text-slate-200">
            Sign in to track orders, reuse saved contact details, and move from catalog browsing to checkout with less
            repeated work.
          </p>
          <div className="mt-10 grid gap-4">
            {[
              'Track your orders from one account',
              'Move faster through the new checkout flow',
              'Keep your details connected to your orders',
            ].map((item) => (
              <div key={item} className="inline-flex items-center gap-3 text-sm text-slate-100">
                <span className="rounded-2xl bg-white/10 p-2 text-gold-400">
                  <ShieldCheck size={16} />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-xl">
          <div className="surface-panel p-8 sm:p-10">
            <div className="lg:hidden">
              <Logo size="md" />
            </div>

            <p className="section-kicker mt-6">Sign in</p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-950">Login to your account</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Continue to {redirect === '/' ? 'the storefront' : 'your next step'} and keep your cart and order history connected.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {error ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Email address</label>
                <div className="relative">
                  <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    className="input pl-11"
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={form.email}
                    onChange={updateField('email')}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    className="input pl-11 pr-11"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={updateField('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full justify-center gap-2 py-3.5 text-base font-bold">
                {loading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Logging in
                  </>
                ) : (
                  <>
                    Login
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Need an account?{' '}
              <Link to={`/register?redirect=${redirect}`} className="font-semibold text-brand-700 hover:text-brand-800">
                Create one here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
