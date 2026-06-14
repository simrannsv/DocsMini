import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(firstName, lastName, email, password)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* Left panel */}
      <div className="w-1/2 bg-blue-600 flex flex-col items-center justify-center text-white p-12">
        <img
          src="https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_document_x32.png"
          alt="docs"
          className="w-16 h-16 mb-4"
        />
        <h1 className="text-4xl font-bold text-center">DocsMini</h1>
        <p className="text-blue-100 mt-3 text-center text-sm max-w-xs">
          Join thousands of users creating and collaborating on documents.
        </p>
        <div className="mt-10 space-y-4 w-full max-w-xs">
          <div className="flex items-center gap-3 bg-blue-500 rounded-lg px-4 py-3">
            <span className="text-2xl">📝</span>
            <p className="text-sm">Write and format documents easily</p>
          </div>
          <div className="flex items-center gap-3 bg-blue-500 rounded-lg px-4 py-3">
            <span className="text-2xl">👥</span>
            <p className="text-sm">Collaborate with others in real time</p>
          </div>
          <div className="flex items-center gap-3 bg-blue-500 rounded-lg px-4 py-3">
            <span className="text-2xl">☁️</span>
            <p className="text-sm">Auto-saved to the cloud</p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-1/2 flex items-center justify-center bg-gray-50 p-12">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Create account</h2>
          <p className="text-gray-500 text-sm mb-8">Fill in your details to get started</p>

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-600 text-sm px-4 py-3 rounded mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-60"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-sm text-gray-500 text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

    </div>
  )
}

export default Register