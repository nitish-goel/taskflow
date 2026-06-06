import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Boards from './pages/Boards'
import Board from './pages/Board'

const PrivateRoute = ({ children }) => {
  return localStorage.getItem('token') ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/boards" element={<PrivateRoute><Boards /></PrivateRoute>} />
      <Route path="/board/:id" element={<PrivateRoute><Board /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}