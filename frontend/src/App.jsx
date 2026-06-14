import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Editor from './pages/Editor'

// protect routes — redirect to login if not logged in
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth()
  return currentUser ? children : <Navigate to='/login' />
}

function App() {
  return (
    <Routes>
      <Route path='/login' element={<Login />} />
      <Route path='/register' element={<Register />} />
      <Route path='/' element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path='/documents/:id' element={
        <ProtectedRoute>
          <Editor />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default App