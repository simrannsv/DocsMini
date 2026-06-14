import exp from "express"
import { DocumentModel } from "../Models/docsModel.js"
import { UserModel } from "../Models/userModel.js"
import { verifyToken } from "../middleware/verifyToken.js"
import { v4 as uuidv4 } from "uuid"

export const docsApp = exp.Router()

// POST /
docsApp.post("/", verifyToken(), async (req, res) => {
  try {
    const newDoc = await DocumentModel.create({
      _id: uuidv4(),                // generate unique UUID as doc ID
      title: "Untitled Document",
      data: {},
      owner: req.user.id            // from decoded JWT
    })

    res.status(201).json({ message: "Document created", document: newDoc })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /
docsApp.get("/", verifyToken(), async (req, res) => {
  try {
    const docs = await DocumentModel
      .find({
        $or: [
          { owner: req.user.id },                          // docs they own
          { "collaborators.user": req.user.id }            // docs shared with them
        ]
      })
      .select("_id title updatedAt owner")                 // only send what dashboard needs
      .sort({ updatedAt: -1 })                             // latest first

    res.status(200).json({ documents: docs })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /docs/:id
docsApp.get("/:id", verifyToken(), async (req, res) => {
  try {
    const doc = await DocumentModel
      .findById(req.params.id)
      .populate("owner", "name email")
      .populate("collaborators.user", "name email")

    if (!doc) {
      return res.status(404).json({ message: "Document not found" })
    }

    // check if user has access
    const isOwner = doc.owner._id.toString() === req.user.id
    const isCollaborator = doc.collaborators.some(
      c => c.user._id.toString() === req.user.id
    )

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: "Access denied" })
    }

    // tell frontend what role this user has
    let role = "viewer"
    if (isOwner) role = "owner"
    else {
      const collab = doc.collaborators.find(
        c => c.user._id.toString() === req.user.id
      )
      role = collab.role
    }

    res.status(200).json({ document: doc, role })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})


// PATCH /docs/:id/title
docsApp.patch("/:id/title", verifyToken(), async (req, res) => {
  try {
    const doc = await DocumentModel.findById(req.params.id)
    if (!doc) return res.status(404).json({ message: "Document not found" })

    // only owner or editor can rename
    const isOwner = doc.owner.toString() === req.user.id
    const isEditor = doc.collaborators.some(
      c => c.user.toString() === req.user.id && c.role === "editor"
    )

    if (!isOwner && !isEditor) {
      return res.status(403).json({ message: "Not authorized" })
    }

    doc.title = req.body.title
    await doc.save()

    res.status(200).json({ message: "Title updated", title: doc.title })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PATCH /docs/:id/share
docsApp.patch("/:id/share", verifyToken(), async (req, res) => {
  try {
    const { email, role } = req.body   // role = 'editor' or 'viewer'

    const doc = await DocumentModel.findById(req.params.id)
    if (!doc) return res.status(404).json({ message: "Document not found" })

    // only owner can share
    if (doc.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only owner can share" })
    }

    // find the user to add by email
    const userToAdd = await UserModel.findOne({ email })
    if (!userToAdd) {
      return res.status(404).json({ message: "No user found with that email" })
    }

    // cant share with yourself
    if (userToAdd._id.toString() === req.user.id) {
      return res.status(400).json({ message: "You are already the owner" })
    }

    // check if already a collaborator
    const alreadyAdded = doc.collaborators.some(
      c => c.user.toString() === userToAdd._id.toString()
    )
    if (alreadyAdded) {
      return res.status(400).json({ message: "User is already a collaborator" })
    }

    doc.collaborators.push({ user: userToAdd._id, role })
    await doc.save()

    res.status(200).json({ message: `${email} added as ${role}` })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})


// DELETE /docs/:id
docsApp.delete("/:id", verifyToken(), async (req, res) => {
  try {
    const doc = await DocumentModel.findById(req.params.id)
    if (!doc) return res.status(404).json({ message: "Document not found" })

    // only owner can delete
    if (doc.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only owner can delete" })
    }

    await DocumentModel.findByIdAndDelete(req.params.id)
    res.status(200).json({ message: "Document deleted" })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})