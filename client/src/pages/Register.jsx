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

    // --- Client-side field validation ---
    const validate = () => {
        const e = {}
        if (!form.name.trim()) e.name = 'Name is required.'
        else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters.'

        if (!form.email.trim()) e.email = 'Email is required.'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.'

        if (!form.password) e.password = 'Password is required.'
        else if (form.password.length < 6) e.password = 'Password must be at least 6 characters.'

        if (!form.confirm) e.confirm = 'Please confirm your password.'
        else if (form.confirm !== form.password) e.confirm = 'Passwords do not match.'

        return e
    }

    const handleChange = (field, value) => {
        setForm({ ...form, [field]: value })
        // Clear error for that field as user types
        if (errors[field]) setErrors({ ...errors, [field]: '' })
    }

    const submit = async (e) => {
        e.preventDefault()
        const fieldErrors = validate()
        if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors)
            return
        }

        setLoading(true)
        try {
            const { data } = await api.post('/auth/register', {
                name: form.name.trim(),
                email: form.email.trim(),
                password: form.password
            })

            if (!data.success) {
                showToast(data.message, 'error')
                return
            }

            localStorage.setItem('token', data.token)
            localStorage.setItem('user', JSON.stringify(data.user))
            showToast(data.message, 'success')
            setTimeout(() => navigate('/boards'), 800)
        } catch (err) {
            const msg = err.response?.data?.message || 'Something went wrong. Please try again.'
            showToast(msg, 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            {ToastComponent}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8">

                <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-gray-900">Create your account</h1>
                    <p className="text-gray-500 text-sm mt-1">Start organizing your work with TaskFlow</p>
                </div>

                <form onSubmit={submit} noValidate className="space-y-5">

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            placeholder="John Doe"
                            value={form.name}
                            onChange={e => handleChange('name', e.target.value)}
                            className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition
                ${errors.name ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'}`}
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={e => handleChange('email', e.target.value)}
                            className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition
                ${errors.email ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'}`}
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            placeholder="Min. 6 characters"
                            value={form.password}
                            onChange={e => handleChange('password', e.target.value)}
                            className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition
                ${errors.password ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'}`}
                        />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                        <input
                            type="password"
                            placeholder="Re-enter your password"
                            value={form.confirm}
                            onChange={e => handleChange('confirm', e.target.value)}
                            className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition
                ${errors.confirm ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'}`}
                        />
                        {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-medium py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Creating account...</>
                        ) : 'Create Account'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-emerald-600 font-medium hover:underline">Sign in</Link>
                </p>
            </div>
        </div>
    )
}