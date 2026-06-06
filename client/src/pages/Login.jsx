import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'
import { useToast } from '../components/Toast'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { showToast, ToastComponent } = useToast()

  const validate = () => {
    const e = {}
    if (!form.email.trim()) e.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.'
    if (!form.password) e.password = 'Password is required.'
    return e
  }

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value })
    if (errors[field]) setErrors({ ...errors, [field]: '' })
  }

  const submit = async (e) => {
    e.preventDefault()
    const fieldErrors = validate()
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return }
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email: form.email.trim(), password: form.password })
      if (!data.success) { showToast(data.message, 'error'); return }
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      showToast(data.message, 'success')
      setTimeout(() => navigate('/boards'), 700)
    } catch (err) {
      showToast(err.response?.data?.message || 'Login failed.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {ToastComponent}

      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12" style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: 'var(--accent)' }}>T</div>
          <span className="font-semibold text-lg" style={{ color: 'var(--text)' }}>TaskFlow</span>
        </div>
        <div>
          <p className="text-4xl font-bold leading-tight mb-4" style={{ color: 'var(--text)' }}>
            Organize work.<br />
            <span style={{ color: 'var(--accent)' }}>Move faster.</span>
          </p>
          <p style={{ color: 'var(--text-muted)' }} className="text-base">Real-time collaboration for teams that ship.</p>
          <div className="mt-10 space-y-4">
            {['Live task updates across your team', 'Kanban boards — drag, drop, done', 'Invite members with one click'].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs text-white flex-shrink-0" style={{ background: 'var(--accent)' }}>✓</div>
                <span style={{ color: 'var(--text-muted)' }} className="text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p style={{ color: 'var(--text-muted)' }} className="text-xs">© 2025 TaskFlow by Nitish Goel</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>Welcome back</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sign in to your account</p>
          </div>

          <form onSubmit={submit} noValidate className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Email</label>
              <input type="email" placeholder="you@example.com" value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                className="tf-input w-full"
                style={{ borderColor: errors.email ? 'var(--danger)' : undefined }} />
              {errors.email && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.email}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Password</label>
              <input type="password" placeholder="••••••••" value={form.password}
                onChange={e => handleChange('password', e.target.value)}
                className="tf-input w-full"
                style={{ borderColor: errors.password ? 'var(--danger)' : undefined }} />
              {errors.password && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.password}</p>}
            </div>
            <button type="submit" disabled={loading} className="tf-btn-primary w-full">
              {loading ? <span className="tf-spinner" /> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
            No account?{' '}
            <Link to="/register" style={{ color: 'var(--accent)' }} className="font-medium hover:underline">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}