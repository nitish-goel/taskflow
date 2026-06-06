import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import api from '../api/axios'
import { useToast } from '../components/Toast'

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:8000')

const COLS = [
    { key: 'todo', label: 'Todo', emoji: '📋', bg: 'var(--col-todo)' },
    { key: 'doing', label: 'Doing', emoji: '⚡', bg: 'var(--col-doing)' },
    { key: 'done', label: 'Done', emoji: '✅', bg: 'var(--col-done)' },
]

export default function Board() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [tasks, setTasks] = useState([])
    const [board, setBoard] = useState(null)
    const [newTask, setNewTask] = useState('')
    const [taskError, setTaskError] = useState('')
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const [movingId, setMovingId] = useState(null)
    const [deletingId, setDeletingId] = useState(null)
    const [showInvite, setShowInvite] = useState(false)
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviting, setInviting] = useState(false)
    const [members, setMembers] = useState([])
    const { showToast, ToastComponent } = useToast()
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    useEffect(() => {
        const init = async () => {
            try {
                // Load board info
                const boardsRes = await api.get('/boards')
                if (boardsRes.data.success) {
                    const found = boardsRes.data.data.find(b => b._id === id)
                    if (!found) { showToast('Board not found.', 'error'); navigate('/boards'); return }
                    setBoard(found)
                    setMembers(found.members || [])
                }
                // Load tasks
                const tasksRes = await api.get('/tasks/' + id)
                if (tasksRes.data.success) setTasks(tasksRes.data.data)
            } catch (err) {
                showToast(err.response?.data?.message || 'Could not load board.', 'error')
                if (err.response?.status === 401 || err.response?.status === 403) navigate('/login')
            } finally {
                setLoading(false)
            }
        }
        init()

        socket.emit('joinBoard', id)
        socket.on('taskCreated', task => setTasks(prev => [task, ...prev]))
        socket.on('taskUpdated', task => setTasks(prev => prev.map(t => t._id === task._id ? task : t)))
        socket.on('taskDeleted', taskId => setTasks(prev => prev.filter(t => t._id !== taskId)))

        return () => {
            socket.off('taskCreated')
            socket.off('taskUpdated')
            socket.off('taskDeleted')
        }
    }, [id])

    const addTask = async () => {
        if (!newTask.trim()) { setTaskError('Task title is required.'); return }
        if (newTask.trim().length < 2) { setTaskError('At least 2 characters.'); return }
        setTaskError('')
        setAdding(true)
        try {
            const { data } = await api.post('/tasks', { title: newTask.trim(), board: id, status: 'todo' })
            if (data.success) { setNewTask(''); showToast(data.message, 'success') }
        } catch (err) {
            showToast(err.response?.data?.message || 'Could not add task.', 'error')
        } finally {
            setAdding(false)
        }
    }

    const moveTask = async (task, status) => {
        if (task.status === status || movingId === task._id) return
        setMovingId(task._id)
        try {
            const { data } = await api.patch('/tasks/' + task._id, { status })
            if (data.success) showToast(data.message, 'success')
        } catch (err) {
            showToast(err.response?.data?.message || 'Could not move task.', 'error')
        } finally {
            setMovingId(null)
        }
    }

    const deleteTask = async (e, task) => {
        e.stopPropagation()
        if (!window.confirm(`Delete "${task.title}"?`)) return
        setDeletingId(task._id)
        try {
            const { data } = await api.delete('/tasks/' + task._id)
            if (data.success) showToast(data.message, 'success')
        } catch (err) {
            showToast(err.response?.data?.message || 'Could not delete task.', 'error')
        } finally {
            setDeletingId(null)
        }
    }

    const inviteMember = async () => {
        if (!inviteEmail.trim()) return
        setInviting(true)
        try {
            const { data } = await api.post(`/boards/${id}/invite`, { email: inviteEmail.trim() })
            if (data.success) {
                showToast(data.message, 'success')
                setInviteEmail('')
                // Refresh board to get updated members
                const boardsRes = await api.get('/boards')
                if (boardsRes.data.success) {
                    const found = boardsRes.data.data.find(b => b._id === id)
                    if (found) setMembers(found.members || [])
                }
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Could not invite member.', 'error')
        } finally {
            setInviting(false)
        }
    }

    const isOwner = board?.owner?._id === user.id || board?.owner === user.id

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
            {ToastComponent}

            {/* Navbar */}
            <nav className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5"
                style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/boards')} className="text-sm flex items-center gap-1.5 transition hover:opacity-70"
                        style={{ color: 'var(--text-muted)' }}>
                        ← Boards
                    </button>
                    <span style={{ color: 'var(--border)' }}>/</span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{board?.title || '...'}</span>
                </div>
                <div className="flex items-center gap-3">
                    {/* Member avatars */}
                    <div className="flex -space-x-2">
                        {[board?.owner, ...(members || [])].filter(Boolean).slice(0, 4).map((m, i) => (
                            <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2"
                                style={{ background: `hsl(${(m?.name?.charCodeAt(0) || i) * 40}, 60%, 50%)`, ringColor: 'var(--surface)' }}>
                                {(m?.name || '?').charAt(0).toUpperCase()}
                            </div>
                        ))}
                    </div>
                    {isOwner && (
                        <button onClick={() => setShowInvite(!showInvite)} className="tf-btn-secondary text-xs px-3 py-1.5">
                            + Invite
                        </button>
                    )}
                </div>
            </nav>

            {/* Invite Panel */}
            {showInvite && (
                <div className="mx-6 mt-4 rounded-xl p-5 max-w-4xl mx-auto" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Invite Team Members</h3>
                        <button onClick={() => setShowInvite(false)} style={{ color: 'var(--text-muted)' }} className="text-lg leading-none">×</button>
                    </div>
                    <div className="flex gap-3 mb-5">
                        <input type="email" placeholder="Enter email address..."
                            value={inviteEmail}
                            onChange={e => setInviteEmail(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && inviteMember()}
                            className="tf-input flex-1" />
                        <button onClick={inviteMember} disabled={inviting} className="tf-btn-primary px-4">
                            {inviting ? <span className="tf-spinner" /> : 'Send Invite'}
                        </button>
                    </div>
                    {/* Current members list */}
                    {members.length > 0 && (
                        <div>
                            <p className="text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Current Members</p>
                            <div className="space-y-2">
                                {members.map((m, i) => (
                                    <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ background: 'var(--bg)' }}>
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                            style={{ background: `hsl(${(m?.name?.charCodeAt(0) || i) * 40}, 60%, 50%)` }}>
                                            {(m?.name || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{m?.name}</p>
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m?.email}</p>
                                        </div>
                                        <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>Member</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="max-w-6xl mx-auto px-6 py-6">
                {/* Add task */}
                <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <input type="text" placeholder="Add a new task... (press Enter)"
                                value={newTask} maxLength={100}
                                onChange={e => { setNewTask(e.target.value); if (taskError) setTaskError('') }}
                                onKeyDown={e => e.key === 'Enter' && addTask()}
                                className="tf-input w-full"
                                style={{ borderColor: taskError ? 'var(--danger)' : undefined }} />
                            {taskError && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{taskError}</p>}
                        </div>
                        <button onClick={addTask} disabled={adding} className="tf-btn-primary px-5 self-start">
                            {adding ? <span className="tf-spinner" /> : '+ Add Task'}
                        </button>
                    </div>
                </div>

                {/* Kanban */}
                {loading ? (
                    <div className="flex justify-center py-20"><span className="tf-spinner-lg" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {COLS.map(col => {
                            const colTasks = tasks.filter(t => t.status === col.key)
                            return (
                                <div key={col.key} className="rounded-xl p-4" style={{ background: col.bg, minHeight: '260px' }}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-base">{col.emoji}</span>
                                            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{col.label}</span>
                                        </div>
                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                                            style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                                            {colTasks.length}
                                        </span>
                                    </div>

                                    {colTasks.length === 0 && (
                                        <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>No tasks here</p>
                                    )}

                                    <div className="space-y-2">
                                        {colTasks.map(task => (
                                            <div key={task._id} className="tf-card"
                                                style={{ opacity: movingId === task._id || deletingId === task._id ? 0.5 : 1 }}>
                                                <div className="flex items-start justify-between gap-2 mb-3">
                                                    <p className="text-sm font-medium leading-snug flex-1" style={{ color: 'var(--text)' }}>{task.title}</p>
                                                    <button onClick={e => deleteTask(e, task)} disabled={deletingId === task._id}
                                                        className="text-base leading-none flex-shrink-0 transition hover:opacity-70"
                                                        style={{ color: 'var(--text-muted)' }}>×</button>
                                                </div>

                                                {/* Assignee */}
                                                {task.assignee && (
                                                    <div className="flex items-center gap-1.5 mb-2">
                                                        <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs"
                                                            style={{ background: `hsl(${task.assignee.name?.charCodeAt(0) * 40}, 60%, 50%)`, fontSize: '9px' }}>
                                                            {task.assignee.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{task.assignee.name}</span>
                                                    </div>
                                                )}

                                                {/* Move buttons */}
                                                <div className="flex gap-1 flex-wrap">
                                                    {COLS.filter(c => c.key !== col.key).map(c => (
                                                        <button key={c.key} onClick={() => moveTask(task, c.key)}
                                                            disabled={movingId === task._id}
                                                            className="text-xs px-2 py-1 rounded-md transition hover:opacity-80"
                                                            style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                                                            → {c.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Summary */}
                {!loading && (
                    <div className="mt-6 flex gap-6 justify-center text-xs" style={{ color: 'var(--text-muted)' }}>
                        {COLS.map(col => (
                            <span key={col.key}>{col.emoji} {col.label}: <strong style={{ color: 'var(--text)' }}>{tasks.filter(t => t.status === col.key).length}</strong></span>
                        ))}
                        <span>Total: <strong style={{ color: 'var(--text)' }}>{tasks.length}</strong></span>
                    </div>
                )}
            </div>
        </div>
    )
}