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

  useEffect(() => {
    fetchBoards()
  }, [])

  const fetchBoards = async () => {
    try {
      const { data } = await api.get('/boards')
      if (data.success) setBoards(data.data)
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not load boards.', 'error')
      if (err.response?.status === 401) navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  const createBoard = async () => {
    if (!title.trim()) { setTitleError('Board name is required.'); return }
    if (title.trim().length < 2) { setTitleError('At least 2 characters.'); return }
    setTitleError('')
    setCreating(true)
    try {
      const { data } = await api.post('/boards', { title })
      if (data.success) { setBoards([data.data, ...boards]); setTitle(''); showToast(data.message, 'success') }
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not create board.', 'error')
    } finally {
      setCreating(false)
    }
  }

  const deleteBoard = async (e, board) => {
    e.stopPropagation()
    if (!window.confirm(`Delete "${board.title}"? This cannot be undone.`)) return
    setDeletingId(board._id)
    try {
      const { data } = await api.delete('/boards/' + board._id)
      if (data.success) { setBoards(boards.filter(b => b._id !== board._id)); showToast(data.message, 'success') }
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete board.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const myBoards = boards.filter(b => b.owner._id === user.id || b.owner === user.id)
  const sharedBoards = boards.filter(b => b.owner._id !== user.id && b.owner !== user.id)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {ToastComponent}

      {/* Navbar */}
      <nav className="sticky top-0 z-30 flex items-center justify-between px-6 py-4" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-sm" style={{ background: 'var(--accent)' }}>T</div>
          <span className="font-semibold" style={{ color: 'var(--text)' }}>TaskFlow</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'var(--accent)' }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm hidden sm:block" style={{ color: 'var(--text)' }}>{user.name}</span>
          </div>
          <button onClick={logout} className="text-xs px-3 py-1.5 rounded-md transition" style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Create board */}
        <div className="rounded-xl p-5 mb-10" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>New Board</h2>
          <div className="flex gap-3">
            <div className="flex-1">
              <input type="text" placeholder="e.g. Sprint 4, Website Redesign..."
                value={title} maxLength={50}
                onChange={e => { setTitle(e.target.value); if (titleError) setTitleError('') }}
                onKeyDown={e => e.key === 'Enter' && createBoard()}
                className="tf-input w-full"
                style={{ borderColor: titleError ? 'var(--danger)' : undefined }} />
              {titleError && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{titleError}</p>}
            </div>
            <button onClick={createBoard} disabled={creating} className="tf-btn-primary px-5 self-start">
              {creating ? <span className="tf-spinner" /> : '+ Create'}
            </button>
          </div>
        </div>

        {/* My Boards */}
        <div className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>My Boards</h2>
          {loading ? (
            <div className="flex justify-center py-16"><span className="tf-spinner-lg" /></div>
          ) : myBoards.length === 0 ? (
            <div className="text-center py-12 rounded-xl" style={{ border: '2px dashed var(--border)' }}>
              <p className="text-2xl mb-2">📋</p>
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>No boards yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Create your first board above</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myBoards.map(b => (
                <BoardCard key={b._id} board={b} userId={user.id} isOwner={true}
                  onClick={() => navigate('/board/' + b._id)}
                  onDelete={e => deleteBoard(e, b)}
                  deleting={deletingId === b._id} />
              ))}
            </div>
          )}
        </div>

        {/* Shared with me */}
        {sharedBoards.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Shared with me</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sharedBoards.map(b => (
                <BoardCard key={b._id} board={b} userId={user.id} isOwner={false}
                  onClick={() => navigate('/board/' + b._id)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function BoardCard({ board, isOwner, onClick, onDelete, deleting }) {
  const memberCount = board.members?.length || 0
  return (
    <div onClick={onClick} className="tf-card group cursor-pointer relative">
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
          style={{ background: stringToColor(board.title) }}>
          {board.title.charAt(0).toUpperCase()}
        </div>
        {isOwner && onDelete && (
          <button onClick={onDelete} disabled={deleting}
            className="opacity-0 group-hover:opacity-100 transition text-lg leading-none w-6 h-6 flex items-center justify-center rounded"
            style={{ color: 'var(--text-muted)' }}>
            {deleting ? '...' : '×'}
          </button>
        )}
      </div>
      <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>{board.title}</p>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {isOwner ? 'Owner' : `By ${board.owner?.name || 'someone'}`}
        {memberCount > 0 && ` · ${memberCount + 1} members`}
      </p>
    </div>
  )
}

function stringToColor(str) {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6']
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}