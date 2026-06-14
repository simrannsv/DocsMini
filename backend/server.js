import exp from 'express'
import { config } from 'dotenv'
import { connect } from 'mongoose'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import http from 'http'
import { Server } from 'socket.io'

import { userApp } from './Apis/userApi.js'
import { docsApp } from './Apis/docsApi.js'

config()

const app = exp()
const port = process.env.PORT || 4545
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173'
const localOriginPattern = /^http:\/\/localhost:\d+$/

// ─── DYNAMIC CORS CONFIGURATION ────────────────
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    if (origin === allowedOrigin || localOriginPattern.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

// ─── HTTP + SOCKET SERVER ─────────────────────
const httpServer = http.createServer(app)
const io = new Server(httpServer, {
  cors: corsOptions
})

// ─── MIDDLEWARE ───────────────────────────────
app.use(cors(corsOptions))
app.use(cookieParser())
app.use(exp.json())

// ─── ROUTES ───────────────────────────────────
app.use('/api/user-api', userApp)
app.use('/api/docs-api', docsApp)

// ─── SOCKET.IO ────────────────────────────────
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id)

  // Track the document room this specific socket is currently looking at
  let currentDocumentId = null;

  socket.on('get-document', async (documentId) => {
    // Leave previous room if switching documents
    if (currentDocumentId) {
      socket.leave(currentDocumentId);
    }
    
    socket.join(documentId)
    currentDocumentId = documentId;

    const { DocumentModel } = await import('./Models/docsModel.js')
    try {
      const document = await DocumentModel.findById(documentId)
      socket.emit('load-document', document ? document.data : {})
    } catch (err) {
      console.error('Error loading document via socket:', err)
      socket.emit('load-document', {})
    }
  })

  socket.on('send-changes', (delta) => {
    if (currentDocumentId) {
      socket.broadcast.to(currentDocumentId).emit('receive-changes', delta)
    }
  })

  socket.on('save-document', async (data) => {
    if (currentDocumentId) {
      try {
        const { DocumentModel } = await import('./Models/docsModel.js')
        await DocumentModel.findByIdAndUpdate(currentDocumentId, { data })
      } catch (err) {
        console.error('Error saving document via socket:', err)
      }
    }
  })

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id)
  })
})

// ─── DB + START SERVER ────────────────────────
async function connectDB() {
  try {
    await connect(process.env.DB_URL)
    console.log("DB connection successful")
    httpServer.listen(port, () => console.log(`Server running on port ${port}`))
  } catch (err) {
    console.log("DB connection error:", err.message)
  }
}

connectDB()
