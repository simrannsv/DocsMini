import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // check if user is already logged in on page load
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const register = async (firstName, lastName, email, password) => {
    const res = await api.post('/api/user-api/users', {
      firstName,
      lastName,
      email,
      password
    })
    return res.data
  }

  const login = async (email, password) => {
    const res = await api.post('/api/user-api/login', { email, password })
    setCurrentUser(res.data.user)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    return res.data
  }

  const logout = async () => {
    await api.post('/api/user-api/logout')
    setCurrentUser(null)
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, register, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

// custom hook — use this in every component
export const useAuth = () => useContext(AuthContext)