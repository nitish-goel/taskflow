const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')
require('dotenv').config()

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

app.use(cors())
app.use(express.json())

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err))

io.on('connection', (socket) => {
    console.log('User connected:', socket.id)
    socket.on('joinBoard', (boardId) => socket.join(boardId))
    socket.on('disconnect', () => console.log('User disconnected'))
})

app.set('io', io)
app.use('/api/auth', require('./routes/auth'))
app.use('/api/boards', require('./routes/boards'))
app.use('/api/tasks', require('./routes/tasks'))

server.listen(process.env.PORT, () =>
    console.log('Server running on port ' + process.env.PORT)
)