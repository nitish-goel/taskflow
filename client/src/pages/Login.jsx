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
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.'
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
        if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors)
            return
        }

        setLoading(true)
        try {
            const { data } = await api.post('/auth/login', {
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
            setTimeout(() => navigate('/boards'), 700)
        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed. Please try again.'
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
                    <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
                    <p className="text-gray-500 text-sm mt-1">Sign in to your TaskFlow account</p>
                </div>

                <form onSubmit={submit} noValidate className="space-y-5">

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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={form.password}
                            onChange={e => handleChange('password', e.target.value)}
                            className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition
                ${errors.password ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'}`}
                        />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-medium py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Signing in...</>
                        ) : 'Sign In'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-6">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-emerald-600 font-medium hover:underline">Create one</Link>
                </p>
            </div>
        </div>
    )
}