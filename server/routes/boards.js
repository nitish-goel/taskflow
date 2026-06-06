const router = require('express').Router()
const auth = require('../middleware/auth')
const Board = require('../models/Board')
const Task = require('../models/Task')

// GET /api/boards — get all boards for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const boards = await Board.find({ owner: req.user.id }).sort({ createdAt: -1 })
    res.json({
      success: true,
      message: boards.length === 0 ? 'No boards yet. Create your first one!' : `Found ${boards.length} board(s).`,
      data: boards
    })
  } catch (err) {
    console.error('Get boards error:', err)
    res.status(500).json({ success: false, message: 'Could not fetch boards. Try again.' })
  }
})

// POST /api/boards — create a new board
router.post('/', auth, async (req, res) => {
  try {
    const { title } = req.body

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Board title is required.' })
    }
    if (title.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Board title must be at least 2 characters.' })
    }
    if (title.trim().length > 50) {
      return res.status(400).json({ success: false, message: 'Board title must be under 50 characters.' })
    }

    // Check for duplicate board name for this user
    const existing = await Board.findOne({ title: title.trim(), owner: req.user.id })
    if (existing) {
      return res.status(409).json({ success: false, message: `You already have a board called "${title.trim()}".` })
    }

    const board = await Board.create({ title: title.trim(), owner: req.user.id })

    res.status(201).json({
      success: true,
      message: `Board "${board.title}" created successfully!`,
      data: board
    })
  } catch (err) {
    console.error('Create board error:', err)
    res.status(500).json({ success: false, message: 'Could not create board. Try again.' })
  }
})

// DELETE /api/boards/:id — delete a board and its tasks
router.delete('/:id', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)

    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found.' })
    }
    if (board.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not allowed to delete this board.' })
    }

    // Delete all tasks in this board too
    await Task.deleteMany({ board: req.params.id })
    await Board.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: `Board "${board.title}" and all its tasks have been deleted.`
    })
  } catch (err) {
    console.error('Delete board error:', err)
    res.status(500).json({ success: false, message: 'Could not delete board. Try again.' })
  }
})

module.exports = router