import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'
import TextEditor from '../components/TextEditor'

function Editor() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [userRole, setUserRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [focusMode, setFocusMode] = useState(false)

  useEffect(() => {
    const fetchDocument = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await api.get(`/api/docs-api/${id}`)
        setTitle(res.data.document.title)
        setUserRole(res.data.role)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load document')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchDocument()
  }, [id])

  const readOnly = userRole === 'viewer'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading document...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-6 rounded shadow text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors
      ${focusMode
        ? 'bg-white dark:bg-gray-950'
        : 'bg-gray-100 dark:bg-gray-950'
      }`}
    >
      {/* Hide navbar in focus mode */}
      {!focusMode && (
        <Navbar
          documentId={id}
          docTitle={title}
          userRole={userRole}
          onTitleChange={(newTitle) => setTitle(newTitle)}
        />
      )}

      {/* Focus mode toggle button */}
      <div className={`flex justify-end px-6 pt-3 ${focusMode ? 'pt-4' : ''}`}>
        <button
          onClick={() => setFocusMode(prev => !prev)}
          className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg transition"
        >
          {focusMode ? '⬡ Exit Focus Mode' : '⬡ Focus Mode'}
        </button>
      </div>

      {/* Editor area */}
      <div className={`flex-1 w-full mx-auto p-6 transition-all
        ${focusMode ? 'max-w-3xl' : 'max-w-4xl'}`}
      >
        <TextEditor
          documentId={id}
          readOnly={readOnly}
          focusMode={focusMode}
        />
      </div>
    </div>
  )
}

export default Editor