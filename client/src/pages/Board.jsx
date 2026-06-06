import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import api from '../api/axios'
import { useToast } from '../components/Toast'

const socket = io('http://localhost:8000')
const COLS = [
    { key: 'todo', label: '📋 Todo', color: 'bg-gray-50 border-gray-200' },
    { key: 'doing', label: '⚡ Doing', color: 'bg-blue-50 border-blue-200' },
    { key: 'done', label: '✅ Done', color: 'bg-emerald-50 border-emerald-200' },
]

export default function Board() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [tasks, setTasks] = useState([])
    const [newTask, setNewTask] = useState('')
    const [taskError, setTaskError] = useState('')
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const [movingId, setMovingId] = useState(null)
    const [deletingId, setDeletingId] = useState(null)
    const [boardTitle, setBoardTitle] = useState('Board')
    const { showToast, ToastComponent } = useToast()

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const { data } = await api.get('/tasks/' + id)
                if (data.success) {
                    setTasks(data.data)
                }
                // Also fetch board title
                const boardRes = await api.get('/boards')
                if (boardRes.data.success) {
                    const board = boardRes.data.data.find(b => b._id === id)
                    if (board) setBoardTitle(board.title)
                    else { showToast('Board not found.', 'error'); navigate('/boards') }
                }
            } catch (err) {
                const msg = err.response?.data?.message || 'Could not load tasks.'
                showToast(msg, 'error')
                if (err.response?.status === 401 || err.response?.status === 403) navigate('/login')
            } finally {
                setLoading(false)
            }
        }

        fetchTasks()
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

    const validateTask = (val) => {
        if (!val.trim()) return 'Task title is required.'
        if (val.trim().length < 2) return 'Task title must be at least 2 characters.'
        if (val.trim().length > 100) return 'Task title must be under 100 characters.'
        return ''
    }

    const addTask = async () => {
        const err = validateTask(newTask)
        if (err) { setTaskError(err); return }
        setTaskError('')
        setAdding(true)
        try {
            const { data } = await api.post('/tasks', { title: newTask.trim(), board: id, status: 'todo' })
            if (data.success) {
                setNewTask('')
                showToast(data.message, 'success')
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Could not add task.'
            showToast(msg, 'error')
        } finally {
            setAdding(false)
        }
    }

    const moveTask = async (task, newStatus) => {
        if (task.status === newStatus) return
        setMovingId(task._id)
        try {
            const { data } = await api.patch('/tasks/' + task._id, { status: newStatus })
            if (data.success) showToast(data.message, 'success')
        } catch (err) {
            const msg = err.response?.data?.message || 'Could not move task.'
            showToast(msg, 'error')
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
            const msg = err.response?.data?.message || 'Could not delete task.'
            showToast(msg, 'error')
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {ToastComponent}

            {/* Navbar */}
            <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3">
                <button onClick={() => navigate('/boards')} className="text-gray-400 hover:text-gray-700 transition text-sm">← Boards</button>
                <span className="text-gray-300">/</span>
                <h1 className="text-base font-semibold text-gray-800">{boardTitle}</h1>
            </nav>

            <div className="max-w-5xl mx-auto px-6 py-8">

                {/* Add task bar */}
                <div className="bg-white border border-gray-100 rounded-xl p-4 mb-8 shadow-sm">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Add a new task... (press Enter)"
                                value={newTask}
                                maxLength={100}
                                onChange={e => {
                                    setNewTask(e.target.value)
                                    if (taskError) setTaskError(validateTask(e.target.value))
                                }}
                                onKeyDown={e => e.key === 'Enter' && addTask()}
                                className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition
                  ${taskError ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'}`}
                            />
                            {taskError && <p className="text-red-500 text-xs mt-1">{taskError}</p>}
                        </div>
                        <button
                            onClick={addTask}
                            disabled={adding}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 self-start"
                        >
                            {adding ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : '+'}
                            {adding ? 'Adding...' : 'Add Task'}
                        </button>
                    </div>
                </div>

                {/* Kanban columns */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <span className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {COLS.map(col => {
                            const colTasks = tasks.filter(t => t.status === col.key)
                            return (
                                <div key={col.key} className={`border rounded-xl p-4 min-h-64 ${col.color}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="font-medium text-sm text-gray-700">{col.label}</h2>
                                        <span className="bg-white border border-gray-200 text-gray-500 text-xs px-2 py-0.5 rounded-full">{colTasks.length}</span>
                                    </div>

                                    {colTasks.length === 0 && (
                                        <p className="text-xs text-gray-400 text-center py-6">No tasks here</p>
                                    )}

                                    {colTasks.map(task => (
                                        <div
                                            key={task._id}
                                            className={`bg-white border border-gray-100 rounded-lg p-3 mb-2 shadow-sm transition
                        ${movingId === task._id || deletingId === task._id ? 'opacity-50' : 'hover:shadow-md'}`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm text-gray-800 leading-snug flex-1">{task.title}</p>
                                                <button
                                                    onClick={e => deleteTask(e, task)}
                                                    disabled={deletingId === task._id}
                                                    className="text-gray-300 hover:text-red-400 transition text-lg leading-none flex-shrink-0"
                                                    title="Delete task"
                                                >×</button>
                                            </div>

                                            {/* Move buttons */}
                                            <div className="flex gap-1 mt-2 flex-wrap">
                                                {COLS.filter(c => c.key !== col.key).map(c => (
                                                    <button
                                                        key={c.key}
                                                        onClick={() => moveTask(task, c.key)}
                                                        disabled={movingId === task._id}
                                                        className="text-xs border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-500 px-2 py-1 rounded transition"
                                                    >
                                                        → {c.label.split(' ')[1]}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Summary bar */}
                {!loading && (
                    <div className="mt-6 flex gap-6 text-sm text-gray-400 justify-center">
                        {COLS.map(col => (
                            <span key={col.key}>{col.label.split(' ')[1]}: <strong className="text-gray-600">{tasks.filter(t => t.status === col.key).length}</strong></span>
                        ))}
                        <span>Total: <strong className="text-gray-600">{tasks.length}</strong></span>
                    </div>
                )}
            </div>
        </div>
    )
}