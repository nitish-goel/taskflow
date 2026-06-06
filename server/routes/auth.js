const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

// Helper: basic email format check
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body

        // --- Validation ---
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'All fields are required (name, email, password).' })
        }
        if (name.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Name must be at least 2 characters.' })
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ success: false, message: 'Please enter a valid email address.' })
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' })
        }

        // --- Check duplicate email ---
        const existing = await User.findOne({ email: email.toLowerCase() })
        if (existing) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' })
        }

        // --- Create user ---
        const hashed = await bcrypt.hash(password, 10)
        const user = await User.create({ name: name.trim(), email: email.toLowerCase(), password: hashed })

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })

        res.status(201).json({
            success: true,
            message: 'Account created successfully! Welcome to TaskFlow.',
            token,
            user: { id: user._id, name: user.name, email: user.email }
        })
    } catch (err) {
        console.error('Register error:', err)
        res.status(500).json({ success: false, message: 'Server error. Please try again later.' })
    }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body

        // --- Validation ---
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' })
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ success: false, message: 'Please enter a valid email address.' })
        }

        // --- Find user ---
        const user = await User.findOne({ email: email.toLowerCase() })
        if (!user) {
            return res.status(404).json({ success: false, message: 'No account found with this email.' })
        }

        // --- Check password ---
        const match = await bcrypt.compare(password, user.password)
        if (!match) {
            return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' })
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })

        res.json({
            success: true,
            message: `Welcome back, ${user.name}!`,
            token,
            user: { id: user._id, name: user.name, email: user.email }
        })
    } catch (err) {
        console.error('Login error:', err)
        res.status(500).json({ success: false, message: 'Server error. Please try again later.' })
    }
})

module.exports = router