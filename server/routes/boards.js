const router = require('express').Router()
const auth = require('../middleware/auth')
const Board = require('../models/Board')
const Task = require('../models/Task')
const User = require('../models/User')

// Helper: check if user has access (owner OR member)
const hasAccess = (board, userId) => {
  return (
    board.owner.toString() === userId ||
    board.members.some(m => m.toString() === userId)
  )
}

// GET /api/boards — get all boards user owns OR is a member of
router.get('/', auth, async (req, res) => {
  try {
    const boards = await Board.find({
      $or: [{ owner: req.user.id }, { members: req.user.id }]
    })
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      message: boards.length === 0 ? 'No boards yet. Create your first one!' : `Found ${boards.length} board(s).`,
      data: boards
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch boards.' })
  }
})

// POST /api/boards — create a new board
router.post('/', auth, async (req, res) => {
  try {
    const { title } = req.body
    if (!title || !title.trim()) return res.status(400).json({ success: false, message: 'Board title is required.' })
    if (title.trim().length < 2) return res.status(400).json({ success: false, message: 'Title must be at least 2 characters.' })
    if (title.trim().length > 50) return res.status(400).json({ success: false, message: 'Title must be under 50 characters.' })

    const existing = await Board.findOne({ title: title.trim(), owner: req.user.id })
    if (existing) return res.status(409).json({ success: false, message: `You already have a board called "${title.trim()}".` })

    const board = await Board.create({ title: title.trim(), owner: req.user.id })
    const populated = await board.populate('owner', 'name email')

    res.status(201).json({ success: true, message: `Board "${board.title}" created!`, data: populated })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not create board.' })
  }
})

// POST /api/boards/:id/invite — invite a member by email
router.post('/:id/invite', auth, async (req, res) => {
  try {
    const { email } = req.body
    if (!email || !email.trim()) return res.status(400).json({ success: false, message: 'Email is required.' })

    const board = await Board.findById(req.params.id)
    if (!board) return res.status(404).json({ success: false, message: 'Board not found.' })

    // Only owner can invite
    if (board.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the board owner can invite members.' })
    }

    // Find the user to invite
    const invitee = await User.findOne({ email: email.toLowerCase().trim() })
    if (!invitee) return res.status(404).json({ success: false, message: `No account found with email "${email}".` })

    // Dont invite yourself
    if (invitee._id.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: "You can't invite yourself." })
    }

    // Already a member?
    if (board.members.some(m => m.toString() === invitee._id.toString())) {
      return res.status(409).json({ success: false, message: `${invitee.name} is already a member.` })
    }

    board.members.push(invitee._id)
    await board.save()

    // Emit socket event so invited user sees board instantly
    req.app.get('io').to(invitee._id.toString()).emit('boardInvite', {
      boardId: board._id,
      boardTitle: board.title,
      message: `You've been added to "${board.title}"!`
    })

    res.json({ success: true, message: `${invitee.name} added to the board successfully!`, data: { name: invitee.name, email: invitee.email } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Could not invite member.' })
  }
})

// DELETE /api/boards/:id/member/:memberId — remove a member
router.delete('/:id/member/:memberId', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
    if (!board) return res.status(404).json({ success: false, message: 'Board not found.' })
    if (board.owner.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Only the owner can remove members.' })

    board.members = board.members.filter(m => m.toString() !== req.params.memberId)
    await board.save()

    res.json({ success: true, message: 'Member removed.' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not remove member.' })
  }
})

// DELETE /api/boards/:id — delete board (owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
    if (!board) return res.status(404).json({ success: false, message: 'Board not found.' })
    if (board.owner.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Only the owner can delete this board.' })

    await Task.deleteMany({ board: req.params.id })
    await Board.findByIdAndDelete(req.params.id)

    res.json({ success: true, message: `Board "${board.title}" deleted.` })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not delete board.' })
  }
})

module.exports = router