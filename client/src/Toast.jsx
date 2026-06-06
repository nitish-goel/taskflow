import { useEffect, useState } from 'react'

// Toast types: 'success' | 'error' | 'info'
export function Toast({ message, type = 'info', onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 3500)
        return () => clearTimeout(t)
    }, [onClose])

    const styles = {
        success: 'bg-emerald-600 text-white',
        error: 'bg-red-500 text-white',
        info: 'bg-gray-800 text-white',
    }

    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
    }

    return (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium max-w-sm animate-slide-up ${styles[type]}`}>
            <span className="text-base">{icons[type]}</span>
            <span>{message}</span>
            <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">×</button>
        </div>
    )
}

// Hook to use toasts easily
export function useToast() {
    const [toast, setToast] = useState(null)

    const showToast = (message, type = 'info') => {
        setToast({ message, type, id: Date.now() })
    }

    const hideToast = () => setToast(null)

    const ToastComponent = toast ? (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={hideToast} />
    ) : null

    return { showToast, ToastComponent }
}