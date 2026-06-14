import { useEffect, useRef, useState } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { io } from 'socket.io-client'
import Groq from 'groq-sdk'

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ align: [] }],
  ['clean']
]

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
})

function TextEditor({ documentId, readOnly, focusMode }) {
  const editorRef = useRef(null)
  const quillRef = useRef(null)
  const socketRef = useRef(null)
  const hasChangesRef = useRef(false)

  // AI state
  const [aiPopup, setAiPopup] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  // word count state
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [readTime, setReadTime] = useState(0)
  const [saveStatus, setSaveStatus] = useState('All changes saved ✓')

  // Step 1 — initialize Quill
  useEffect(() => {
    if (!editorRef.current) return

    const editorDiv = document.createElement('div')
    editorRef.current.append(editorDiv)

    const quill = new Quill(editorDiv, {
      theme: 'snow',
      modules: { toolbar: TOOLBAR_OPTIONS }
    })

    quill.disable()
    quillRef.current = quill

    return () => {
      if (editorRef.current) editorRef.current.innerHTML = ''
    }
  }, [])

  // Step 2 — socket + real-time sync
  useEffect(() => {
    if (!documentId || !quillRef.current) return

    const quill = quillRef.current

    const socket =io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:4545', { withCredentials: true })
    socketRef.current = socket

    socket.emit('get-document', documentId)

    socket.on('load-document', (data) => {
      quill.setContents(data)
      if (!readOnly) quill.enable()
      updateCounts(quill.getText())
    })

    socket.on('receive-changes', (delta) => {
      quill.updateContents(delta)
    })

    const handleTextChange = (delta, _, source) => {
      if (source !== 'user') return
      socket.emit('send-changes', delta)
      hasChangesRef.current = true
      setSaveStatus('Saving...')
      updateCounts(quill.getText())
    }

    if (!readOnly) {
      quill.on('text-change', handleTextChange)
    }

    const interval = setInterval(() => {
      if (hasChangesRef.current) {
        socket.emit('save-document', quill.getContents())
        hasChangesRef.current = false
        setSaveStatus('All changes saved ✓')
      }
    }, 2000)

    return () => {
      socket.off('load-document')
      socket.off('receive-changes')
      quill.off('text-change', handleTextChange)
      clearInterval(interval)
      socket.disconnect()
    }
  }, [documentId, readOnly])

  // Step 3 — readOnly toggle
  useEffect(() => {
    if (!quillRef.current) return
    if (readOnly) {
      quillRef.current.disable()
    } else {
      quillRef.current.enable()
    }
  }, [readOnly])

  // Step 4 — detect text selection → show AI popup
  useEffect(() => {
    if (!quillRef.current || readOnly) return

    const quill = quillRef.current

    const handleSelectionChange = (range) => {
      if (!range || range.length === 0) {
        setAiPopup(null)
        return
      }

      const selectedText = quill.getText(range.index, range.length).trim()
      if (!selectedText || selectedText.length < 5) {
        setAiPopup(null)
        return
      }

      const bounds = quill.getBounds(range.index, range.length)
      const editorContainer = editorRef.current.getBoundingClientRect()

      setAiPopup({
        top: bounds.bottom + editorContainer.top + window.scrollY + 8,
        left: bounds.left + editorContainer.left,
        text: selectedText,
        index: range.index,
        length: range.length
      })
      setAiError('')
    }

    quill.on('selection-change', handleSelectionChange)
    return () => quill.off('selection-change', handleSelectionChange)
  }, [readOnly])

  // Step 5 — word count helper
  const updateCounts = (text) => {
    const cleaned = text.trim()
    const words = cleaned === '' ? 0 : cleaned.split(/\s+/).filter(w => w.length > 0).length
    const chars = cleaned.length
    const time = Math.ceil(words / 200)
    setWordCount(words)
    setCharCount(chars)
    setReadTime(time)
  }

  // Step 6 — Groq AI action
  const handleAiAction = async (action) => {
    if (!aiPopup || aiLoading) return

    const prompts = {
      rewrite: `Rewrite the following text to make it clearer and better. Return only the rewritten text, nothing else:\n\n"${aiPopup.text}"`,
      summarize: `Summarize the following text in 1-2 sentences. Return only the summary, nothing else:\n\n"${aiPopup.text}"`,
      expand: `Expand the following text by adding more detail and explanation. Return only the expanded text, nothing else:\n\n"${aiPopup.text}"`
    }

    setAiLoading(true)
    setAiError('')

    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompts[action] }],
        max_tokens: 1000,
        temperature: 0.7
      })

      const aiText = completion.choices?.[0]?.message?.content?.trim()
      if (!aiText) throw new Error('No response from AI')

      const quill = quillRef.current
      quill.deleteText(aiPopup.index, aiPopup.length)
      quill.insertText(aiPopup.index, aiText)

      // update counts after AI change
      updateCounts(quill.getText())

      hasChangesRef.current = true
      setSaveStatus('Saving...')
      setAiPopup(null)

    } catch (err) {
      console.error(err)
      setAiError('AI failed. Try again.')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded shadow-sm">

      {/* Quill editor */}
      <div ref={editorRef} className="min-h-[70vh]"></div>

      {/* Word count footer */}
      {!focusMode && (
        <div className="flex items-center justify-between px-6 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b text-xs text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-4">
            <span>{wordCount} words</span>
            <span>{charCount} characters</span>
            <span>{readTime} min read</span>
          </div>
          <span className={
            saveStatus === 'Saving...'
              ? 'text-yellow-500'
              : 'text-green-500'
          }>
            {saveStatus}
          </span>
        </div>
      )}

      {/* AI Popup */}
      {aiPopup && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg px-3 py-2 flex items-center gap-2"
          style={{ top: aiPopup.top, left: aiPopup.left }}
        >
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">
            ✨ AI
          </span>

          {aiLoading ? (
            <span className="text-xs text-blue-500 animate-pulse">
              Thinking...
            </span>
          ) : (
            <>
              <button
                onClick={() => handleAiAction('rewrite')}
                className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
              >
                Rewrite
              </button>
              <button
                onClick={() => handleAiAction('summarize')}
                className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded hover:bg-purple-100 transition"
              >
                Summarize
              </button>
              <button
                onClick={() => handleAiAction('expand')}
                className="text-xs bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded hover:bg-green-100 transition"
              >
                Expand
              </button>
              <button
                onClick={() => setAiPopup(null)}
                className="text-xs text-gray-400 hover:text-gray-600 ml-1"
              >
                ✕
              </button>
            </>
          )}

          {aiError && (
            <span className="text-xs text-red-500 ml-1">{aiError}</span>
          )}
        </div>
      )}
    </div>
  )
}

export default TextEditor
