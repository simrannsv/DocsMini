import { Schema, model } from "mongoose"   // ← lowercase model

const userSchema = new Schema({
  firstName: {
    type: String,
    required: [true, "First name is required"]
  },
  lastName: {
    type: String
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true
  },
  password: {
    type: String,
    required: [true, "Password is required"]
  },
  role: {
    type: String,
    enum: ["OWNER", "EDITOR", "VIEWER"],
    default: "OWNER"                        // ← default, not required
  }
},
{
  timestamps: true,
  versionKey: false,
  strict: "throw"
})

export const UserModel = model("User", userSchema)  // ← lowercase model()