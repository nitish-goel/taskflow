import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 10000, // 10 second timeout
})

// Attach JWT token to every request automatically
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = 'Bearer ' + token
    return config
  },
  error => Promise.reject(error)
)

// Global response error handler
api.interceptors.response.use(
  response => response,
  error => {
    // If token is expired or invalid, force logout
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api