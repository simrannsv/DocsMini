import exp from "express"
import { UserModel } from "../Models/userModel.js"
import { config } from "dotenv"
import { hash, compare } from "bcrypt"
import jwt from "jsonwebtoken"

const { sign } = jwt
config()

export const userApp = exp.Router()

// ─── REGISTER ────────────────────────────────
userApp.post("/users", async (req, res) => {
  try {
    const newUser = req.body

    newUser.password = await hash(newUser.password, 12)

    const newUserDoc = new UserModel(newUser)
    await newUserDoc.save()

    res.status(201).json({ message: "User created" })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Email already registered. Try logging in." })
    }
    res.status(500).json({ message: err.message })
  }
})

// ─── LOGIN ────────────────────────────────────
userApp.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await UserModel.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "No account found with this email" })
    }

    const isMatched = await compare(password, user.password)
    if (!isMatched) {
      return res.status(400).json({ message: "Wrong password" })
    }

    const signedToken = sign(
      {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role ?? 'USER'
      },
      process.env.SECRET_KEY,
      { expiresIn: "7d" }
    )

    // 🌟 FIXED FOR PRODUCTION: Cross-domain cookie configuration
    res.cookie("token", signedToken, {
      httpOnly: true,
      secure: true,      // Required for HTTPS (Render defaults to HTTPS)
      sameSite: "none",   // Allows cookie sharing across Vercel and Render domains
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    let userObj = user.toObject()
    delete userObj.password

    res.status(200).json({
      message: "Login success",
      user: userObj
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── LOGOUT ───────────────────────────────────
userApp.post("/logout", (req, res) => {
  // 🌟 FIXED FOR PRODUCTION: Must match exact configuration options used at login to clear cleanly
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  })
  res.status(200).json({ message: "Logout success" })
})
