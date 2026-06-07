import { useEffect, useState } from 'react'

export function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  const styles = {
    success: { background: '#10b981', color: '#fff' },
    error: { background: '#ef4444', color: '#fff' },
    info: { background: '#1a1d27', color: '#e8eaf0', border: '1px solid #2a2d3d' },
  }

  const icons = { success: '✓', error: '✕', info: 'ℹ' }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium max-w-sm animate-slide-up"
      style={styles[type]}>
      <span>{icons[type]}</span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 text-lg leading-none">×</button>
    </div>
  )
}

export function useToast() {
  const [toast, setToast] = useState(null)
  const showToast = (message, type = 'info') => setToast({ message, type, id: Date.now() })
  const hideToast = () => setToast(null)
  const ToastComponent = toast ? <Toast key={toast.id} message={toast.message} type={toast.type} onClose={hideToast} /> : null
  return { showToast, ToastComponent }
}