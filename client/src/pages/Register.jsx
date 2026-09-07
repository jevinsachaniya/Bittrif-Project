import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Loader, Lock, Mail, Phone, ShieldCheck, User } from 'lucide-react'
import Logo from '../components/Logo'
import { useAuth } from '../hooks/useAuth'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirect = new URLSearchParams(location.search).get('redirect') || '/'

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
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
      await register(form.name, form.email, form.phone, form.password)
      navigate(redirect)
    } catch (submitError) {
      setError(submitError.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell min-h-screen bg-[linear-gradient(180deg,_rgba(16,41,71,0.05),_transparent_28rem)]">
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="hidden rounded-[2rem] bg-white p-10 shadow-2xl shadow-slate-900/5 lg:block">
          <Logo size="lg" />
          <p className="section-kicker mt-10">Create your buyer account</p>
          <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-slate-950">
            Make repeat ordering easier for your team.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-8 text-slate-600">
            Register once, then keep order history, checkout details, and company information closer to the buying flow.
          </p>
          <div className="mt-10 grid gap-4">
            {[
              'Use the upgraded checkout with saved company and delivery details',
              'Track orders from the same account after they are placed',
              'Reduce repeated manual entry for recurring purchases',
            ].map((item) => (
              <div key={item} className="inline-flex items-center gap-3 text-sm text-slate-700">
                <span className="rounded-2xl bg-brand-50 p-2 text-brand-700">
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

            <p className="section-kicker mt-6">Register</p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-950">Create your account</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Set up access for the Bittrif storefront and continue to {redirect === '/' ? 'shopping' : 'your next step'} when you finish.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {error ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Full name</label>
                <div className="relative">
                  <User size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    className="input pl-11"
                    required
                    placeholder="Your full name"
                    value={form.name}
                    onChange={updateField('name')}
                  />
                </div>
              </div>

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
                <label className="mb-2 block text-sm font-semibold text-slate-700">Phone number</label>
                <div className="relative">
                  <Phone size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    className="input pl-11"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={updateField('phone')}
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
                    minLength={6}
                    placeholder="Minimum 6 characters"
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
                    Creating account
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already registered?{' '}
              <Link to={`/login?redirect=${redirect}`} className="font-semibold text-brand-700 hover:text-brand-800">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
