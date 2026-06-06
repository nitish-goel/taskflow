import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useToast } from '../components/Toast'

export default function Boards() {
    const [boards, setBoards] = useState([])
    const [title, setTitle] = useState('')
    const [titleError, setTitleError] = useState('')
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [deletingId, setDeletingId] = useState(null)
    const navigate = useNavigate()
    const { showToast, ToastComponent } = useToast()

    const user = JSON.parse(localStorage.getItem('user') || '{}')

    // Load boards on mount
    useEffect(() => {
        const fetchBoards = async () => {
            try {
                const { data } = await api.get('/boards')
                if (data.success) {
                    setBoards(data.data)
                    if (data.data.length === 0) showToast(data.message, 'info')
                }
            } catch (err) {
                const msg = err.response?.data?.message || 'Could not load boards.'
                showToast(msg, 'error')
                // If unauthorized, kick to login
                if (err.response?.status === 401) navigate('/login')
            } finally {
                setLoading(false)
            }
        }
        fetchBoards()
    }, [])

    const validateTitle = (val) => {
        if (!val.trim()) return 'Board name is required.'
        if (val.trim().length < 2) return 'Board name must be at least 2 characters.'
        if (val.trim().length > 50) return 'Board name must be under 50 characters.'
        return ''
    }

    const createBoard = async () => {
        const err = validateTitle(title)
        if (err) { setTitleError(err); return }
        setTitleError('')
        setCreating(true)
        try {
            const { data } = await api.post('/boards', { title })
            if (data.success) {
                setBoards([data.data, ...boards])
                setTitle('')
                showToast(data.message, 'success')
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Could not create board.'
            showToast(msg, 'error')
        } finally {
            setCreating(false)
        }
    }

    const deleteBoard = async (e, board) => {
        e.stopPropagation()
        if (!window.confirm(`Delete "${board.title}" and all its tasks? This cannot be undone.`)) return
        setDeletingId(board._id)
        try {
            const { data } = await api.delete('/boards/' + board._id)
            if (data.success) {
                setBoards(boards.filter(b => b._id !== board._id))
                showToast(data.message, 'success')
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Could not delete board.'
            showToast(msg, 'error')
        } finally {
            setDeletingId(null)
        }
    }

    const logout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {ToastComponent}

            {/* Navbar */}
            <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <h1 className="text-lg font-semibold text-gray-900">TaskFlow</h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">Hi, {user.name || 'User'}</span>
                    <button onClick={logout} className="text-sm text-red-500 hover:underline">Logout</button>
                </div>
            </nav>

            <div className="max-w-3xl mx-auto px-6 py-10">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">My Boards</h2>

                {/* Create board form */}
                <div className="bg-white border border-gray-100 rounded-xl p-5 mb-8 shadow-sm">
                    <p className="text-sm font-medium text-gray-700 mb-3">Create a new board</p>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="e.g. Website Redesign, Sprint 4..."
                                value={title}
                                maxLength={50}
                                onChange={e => {
                                    setTitle(e.target.value)
                                    if (titleError) setTitleError(validateTitle(e.target.value))
                                }}
                                onKeyDown={e => e.key === 'Enter' && createBoard()}
                                className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition
                  ${titleError ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'}`}
                            />
                            {titleError && <p className="text-red-500 text-xs mt-1">{titleError}</p>}
                            <p className="text-xs text-gray-400 mt-1 text-right">{title.length}/50</p>
                        </div>
                        <button
                            onClick={createBoard}
                            disabled={creating}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 self-start"
                        >
                            {creating ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : '+'}
                            {creating ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </div>

                {/* Boards list */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <span className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
                    </div>
                ) : boards.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <p className="text-4xl mb-3">📋</p>
                        <p className="font-medium text-gray-600">No boards yet</p>
                        <p className="text-sm mt-1">Create your first board above to get started</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {boards.map(b => (
                            <div
                                key={b._id}
                                onClick={() => navigate('/board/' + b._id)}
                                className="bg-white border border-gray-100 rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-emerald-200 transition group relative"
                            >
                                <p className="font-medium text-gray-800 group-hover:text-emerald-700 transition pr-8">{b.title}</p>
                                <p className="text-xs text-gray-400 mt-1">{new Date(b.createdAt).toLocaleDateString()}</p>
                                <button
                                    onClick={e => deleteBoard(e, b)}
                                    disabled={deletingId === b._id}
                                    className="absolute top-4 right-4 text-gray-300 hover:text-red-400 transition text-lg leading-none"
                                    title="Delete board"
                                >
                                    {deletingId === b._id ? '...' : '×'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}