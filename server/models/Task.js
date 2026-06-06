const mongoose = require('mongoose')
const TaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    status: { type: String, enum: ['todo', 'doing', 'done'], default: 'todo' },
    board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board' },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })
module.exports = mongoose.model('Task', TaskSchema)