import { Schema,model } from "mongoose";


const collaboratorSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  role: {
    type: String,
    enum: ["editor", "viewer"],
    default: "editor"
  }
})

const documentSchema = new Schema({
  _id: {
    type: String,       // UUID — becomes the URL param /documents/:id
    required: true
  },
  title: {
    type: String,
    default: "Untitled Document",
    trim: true
  },
  data: {
    type: Object,       // Quill delta format { ops: [...] }
    default: {}
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  collaborators: [collaboratorSchema]

}, { timestamps: true })

export const DocumentModel = model("Document", documentSchema)