import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../services/api'

function Navbar({ documentId = null, docTitle = '', userRole = null, onTitleChange = () => {} }) {
  const { currentUser, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [title, setTitle] = useState(docTitle)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [shareEmail, setShareEmail] = useState('')
  const [shareRole, setShareRole] = useState('editor')
  const [shareError, setShareError] = useState('')
  const [shareSuccess, setShareSuccess] = useState('')

  useEffect(() => {
    setTitle(docTitle)
  }, [docTitle])

  const handleRename = async () => {
    if (!title.trim()) return alert('Title cannot be empty')
    try {
      const res = await api.patch(`/api/docs-api/${documentId}/title`, {
        title: title.trim()
      })
      onTitleChange(res.data.title)
      setIsEditingTitle(false)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to rename')
    }
  }

  const handleShare = async (e) => {
    e.preventDefault()
    setShareError('')
    setShareSuccess('')
    try {
      const res = await api.patch(`/api/docs-api/${documentId}/share`, {
        email: shareEmail.trim(),
        role: shareRole
      })
      setShareSuccess(res.data.message || 'Shared successfully')
      setShareEmail('')
    } catch (err) {
      setShareError(err.response?.data?.message || 'Failed to share')
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const canRename = userRole === 'owner' || userRole === 'editor'
  const canShare = userRole === 'owner'

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between transition-colors">

      {/* Left */}
      <div className="flex items-center gap-4">
        <Link to="/" className="text-blue-600 font-bold text-xl">
          DocsMini
        </Link>

        {documentId && (
          <>
            <span className="text-gray-300 dark:text-gray-600">|</span>

            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white px-2 py-1 rounded text-sm outline-none"
                />
                <button
                  onClick={handleRename}
                  className="bg-blue-600 text-white text-xs px-2 py-1 rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => { setTitle(docTitle); setIsEditingTitle(false) }}
                  className="bg-gray-200 dark:bg-gray-700 dark:text-white text-gray-700 text-xs px-2 py-1 rounded"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800 dark:text-white">
                  {docTitle || 'Untitled Document'}
                </span>
                {canRename && (
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="text-xs text-blue-500 hover:underline"
                  >
                    Rename
                  </button>
                )}
              </div>
            )}

            {userRole && (
              <span className="text-xs bg-gray-100 dark:bg-gray-700 dark:text-gray-300 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                {userRole}
              </span>
            )}
          </>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="text-xl hover:scale-110 transition"
          title="Toggle dark mode"
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        <Link to="/" className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600">
          Dashboard
        </Link>

        {canShare && documentId && (
          <button
            onClick={() => { setShareError(''); setShareSuccess(''); setIsShareOpen(true) }}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded"
          >
            Share
          </button>
        )}

        <span className="text-sm text-gray-600 dark:text-gray-300">
          {currentUser?.firstName} {currentUser?.lastName}
        </span>

        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      {/* Share Modal */}
      {isShareOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded shadow p-6 w-96">
            <h2 className="text-lg font-bold mb-4 dark:text-white">Share Document</h2>

            {shareError && <p className="text-red-500 text-sm mb-3">{shareError}</p>}
            {shareSuccess && <p className="text-green-500 text-sm mb-3">{shareSuccess}</p>}

            <form onSubmit={handleShare}>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                placeholder="collaborator@email.com"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2 text-sm mb-4 outline-none"
                required
              />

              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Role</label>
              <select
                value={shareRole}
                onChange={(e) => setShareRole(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2 text-sm mb-6 outline-none"
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsShareOpen(false)}
                  className="bg-gray-200 dark:bg-gray-700 dark:text-white text-gray-700 text-sm px-4 py-2 rounded"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white text-sm px-4 py-2 rounded"
                >
                  Share
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar