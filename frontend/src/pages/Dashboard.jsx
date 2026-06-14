import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../services/api'

function Dashboard() {
  const { currentUser, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDocuments = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/api/docs-api/')
      setDocuments(res.data.documents || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const handleCreateDocument = async () => {
    try {
      const res = await api.post('/api/docs-api/')
      navigate(`/documents/${res.data.document._id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create document')
    }
  }

  const handleDeleteDocument = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('Delete this document?')) return
    try {
      await api.delete(`/api/docs-api/${id}`)
      setDocuments(documents.filter(doc => doc._id !== id))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete')
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">

      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-8 py-4 flex items-center justify-between shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <img
            src="https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_document_x32.png"
            alt="docs"
            className="w-8 h-8"
          />
          <span className="text-blue-600 font-bold text-xl">DocsMini</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="text-xl hover:scale-110 transition"
            title="Toggle dark mode"
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          <div className="text-right">
            <p className="text-sm font-medium text-gray-800 dark:text-white">
              {currentUser?.firstName} {currentUser?.lastName}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {currentUser?.email}
            </p>
          </div>

          {/* Avatar initials */}
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
            {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
          </div>

          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded-lg hover:border-red-300 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-8 py-10">

        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              My Documents
            </h1>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
              {documents.length} document{documents.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleCreateDocument}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition"
          >
            <span className="text-lg leading-none">+</span>
            New Document
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-400 dark:text-gray-500">
              Loading your documents...
            </p>
          </div>

        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 transition-colors">
            <span className="text-5xl mb-4">📄</span>
            <h3 className="text-gray-700 dark:text-gray-200 font-semibold text-lg mb-2">
              No documents yet
            </h3>
            <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">
              Create your first document to get started
            </p>
            <button
              onClick={handleCreateDocument}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              + Create Document
            </button>
          </div>

        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {documents.map((doc) => (
              <div
                key={doc._id}
                onClick={() => navigate(`/documents/${doc._id}`)}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition group"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-3xl">📄</span>
                  {doc.owner === currentUser?.id && (
                    <button
                      onClick={(e) => handleDeleteDocument(doc._id, e)}
                      className="text-xs text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                    >
                      Delete
                    </button>
                  )}
                </div>

                <h3 className="font-semibold text-gray-800 dark:text-white text-sm mb-1 truncate">
                  {doc.title || 'Untitled Document'}
                </h3>

                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(doc.updatedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>

                {doc.owner !== currentUser?.id && (
                  <span className="inline-block mt-2 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                    Shared with you
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard