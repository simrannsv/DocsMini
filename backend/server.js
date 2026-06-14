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
const corsOrigins = [allowedOrigin, localOriginPattern]

// ─── HTTP + SOCKET SERVER ─────────────────────
const httpServer = http.createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
})

// ─── MIDDLEWARE ───────────────────────────────
app.use(cors({
  origin: corsOrigins,
  credentials: true
}))
app.use(cookieParser())
app.use(exp.json())

// ─── ROUTES ───────────────────────────────────
app.use('/api/user-api', userApp)
app.use('/api/docs-api', docsApp)

// ─── SOCKET.IO ────────────────────────────────
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id)

  socket.on('get-document', async (documentId) => {
    socket.join(documentId)

    const { DocumentModel } = await import('./Models/docsModel.js')
    try {
      const document = await DocumentModel.findById(documentId)
      socket.emit('load-document', document ? document.data : {})
    } catch (err) {
      console.error('Error loading document via socket:', err)
      socket.emit('load-document', {})
    }

    socket.on('send-changes', (delta) => {
      socket.broadcast.to(documentId).emit('receive-changes', delta)
    })

    socket.on('save-document', async (data) => {
      await DocumentModel.findByIdAndUpdate(documentId, { data })
    })
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