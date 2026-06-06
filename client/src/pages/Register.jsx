import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'
import { useToast } from '../components/Toast'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { showToast, ToastComponent } = useToast()

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required.'
    else if (form.name.trim().length < 2) e.name = 'At least 2 characters.'
    if (!form.email.trim()) e.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.'
    if (!form.password) e.password = 'Password is required.'
    else if (form.password.length < 6) e.password = 'At least 6 characters.'
    if (!form.confirm) e.confirm = 'Please confirm password.'
    else if (form.confirm !== form.password) e.confirm = 'Passwords do not match.'
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
      const { data } = await api.post('/auth/register', { name: form.name.trim(), email: form.email.trim(), password: form.password })
      if (!data.success) { showToast(data.message, 'error'); return }
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      showToast(data.message, 'success')
      setTimeout(() => navigate('/boards'), 800)
    } catch (err) {
      showToast(err.response?.data?.message || 'Registration failed.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { key: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
    { key: 'password', label: 'Password', type: 'password', placeholder: 'Min. 6 characters' },
    { key: 'confirm', label: 'Confirm Password', type: 'password', placeholder: 'Re-enter password' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
      {ToastComponent}
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-sm" style={{ background: 'var(--accent)' }}>T</div>
          <span className="font-semibold" style={{ color: 'var(--text)' }}>TaskFlow</span>
        </div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>Create your account</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Free forever. No credit card needed.</p>

        <form onSubmit={submit} noValidate className="space-y-4">
          {fields.map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
              <input type={f.type} placeholder={f.placeholder} value={form[f.key]}
                onChange={e => handleChange(f.key, e.target.value)}
                className="tf-input w-full"
                style={{ borderColor: errors[f.key] ? 'var(--danger)' : undefined }} />
              {errors[f.key] && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors[f.key]}</p>}
            </div>
          ))}
          <button type="submit" disabled={loading} className="tf-btn-primary w-full">
            {loading ? <span className="tf-spinner" /> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)' }} className="font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}