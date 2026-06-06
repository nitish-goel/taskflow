const router = require('express').Router()
const auth = require('../middleware/auth')
const Task = require('../models/Task')
const Board = require('../models/Board')

const VALID_STATUSES = ['todo', 'doing', 'done']

// Check if user has access to board (owner or member)
const hasAccess = (board, userId) =>
  board.owner.toString() === userId ||
  board.members.some(m => m.toString() === userId)

// GET /api/tasks/:boardId
router.get('/:boardId', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId)
    if (!board) return res.status(404).json({ success: false, message: 'Board not found.' })
    if (!hasAccess(board, req.user.id)) return res.status(403).json({ success: false, message: 'Access denied.' })

    const tasks = await Task.find({ board: req.params.boardId })
      .populate('assignee', 'name email')
      .sort({ createdAt: -1 })

    res.json({ success: true, message: `Loaded ${tasks.length} task(s).`, data: tasks })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch tasks.' })
  }
})

// POST /api/tasks
router.post('/', auth, async (req, res) => {
  try {
    const { title, board, status } = req.body

    if (!title || !title.trim()) return res.status(400).json({ success: false, message: 'Task title is required.' })
    if (title.trim().length < 2) return res.status(400).json({ success: false, message: 'Title must be at least 2 characters.' })
    if (title.trim().length > 100) return res.status(400).json({ success: false, message: 'Title must be under 100 characters.' })
    if (!board) return res.status(400).json({ success: false, message: 'Board ID is required.' })
    if (status && !VALID_STATUSES.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status.' })

    const boardDoc = await Board.findById(board)
    if (!boardDoc) return res.status(404).json({ success: false, message: 'Board not found.' })
    if (!hasAccess(boardDoc, req.user.id)) return res.status(403).json({ success: false, message: 'Access denied.' })

    const task = await Task.create({ title: title.trim(), board, status: status || 'todo', assignee: req.user.id })
    const populated = await task.populate('assignee', 'name email')

    req.app.get('io').to(board).emit('taskCreated', populated)

    res.status(201).json({ success: true, message: `Task "${task.title}" added!`, data: populated })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not create task.' })
  }
})

// PATCH /api/tasks/:id
router.patch('/:id', auth, async (req, res) => {
  try {
    const { status, title } = req.body

    if (status && !VALID_STATUSES.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status.' })
    if (title !== undefined && !title.trim()) return res.status(400).json({ success: false, message: 'Title cannot be empty.' })

    const task = await Task.findById(req.params.id)
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' })

    const board = await Board.findById(task.board)
    if (!board || !hasAccess(board, req.user.id)) return res.status(403).json({ success: false, message: 'Access denied.' })

    const updates = {}
    if (status) updates.status = status
    if (title) updates.title = title.trim()

    const updated = await Task.findByIdAndUpdate(req.params.id, updates, { new: true }).populate('assignee', 'name email')

    req.app.get('io').to(task.board.toString()).emit('taskUpdated', updated)

    res.json({ success: true, message: status ? `Task moved to "${status}".` : 'Task updated.', data: updated })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not update task.' })
  }
})

// DELETE /api/tasks/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' })

    const board = await Board.findById(task.board)
    if (!board || !hasAccess(board, req.user.id)) return res.status(403).json({ success: false, message: 'Access denied.' })

    await Task.findByIdAndDelete(req.params.id)
    req.app.get('io').to(task.board.toString()).emit('taskDeleted', task._id)

    res.json({ success: true, message: `Task "${task.title}" deleted.` })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not delete task.' })
  }
})

module.exports = router