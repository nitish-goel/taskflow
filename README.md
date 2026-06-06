# TaskFlow 🗂️

A real-time collaborative task manager built with the MERN stack. Create boards, manage tasks across a Kanban layout, and watch updates reflect live across all connected users — powered by Socket.io.

🔗 **[Live Demo](https://taskflow-kappa-jet.vercel.app/boards)** &nbsp;|&nbsp; 📁 **[GitHub](https://github.com/nitish-goel/taskflow)**

---

## Screenshots

> ![TaskFlow Board](./screenshots/board.png)

---

## Features

- 🔐 **JWT Authentication** — Secure register/login with bcrypt password hashing and auto token expiry
- 📋 **Boards** — Create and manage multiple project boards
- ✅ **Kanban Tasks** — Add tasks and move them across Todo → Doing → Done columns
- ⚡ **Real-time Updates** — Task changes broadcast instantly to all users on the same board via Socket.io
- 🛡️ **Protected Routes** — All board and task endpoints require a valid JWT token
- 📱 **Responsive UI** — Clean interface built with Tailwind CSS

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Real-time | Socket.io |
| Auth | JSON Web Tokens (JWT), bcryptjs |
| Deployment | Vercel (frontend), Render (backend), MongoDB Atlas |

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB Atlas account (free tier works)

### 1. Clone the repo

```bash
git clone https://github.com/nitish-goel/taskflow.git
cd taskflow
```

### 2. Set up the backend

```bash
cd server
npm install
```

Create a `.env` file inside the `server/` folder:

```env
PORT=8000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key
```

Start the server:

```bash
node index.js
```

### 3. Set up the frontend

```bash
cd ../client
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT token |

### Boards _(requires JWT)_
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/boards` | Get all boards for logged-in user |
| POST | `/api/boards` | Create a new board |
| DELETE | `/api/boards/:id` | Delete a board and its tasks |

### Tasks _(requires JWT)_
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks/:boardId` | Get all tasks for a board |
| POST | `/api/tasks` | Create a new task |
| PATCH | `/api/tasks/:id` | Update task status or title |
| DELETE | `/api/tasks/:id` | Delete a task |

---

## Project Structure

```
taskflow/
├── server/
│   ├── models/
│   │   ├── User.js
│   │   ├── Board.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── boards.js
│   │   └── tasks.js
│   ├── middleware/
│   │   └── auth.js
│   └── index.js
└── client/
    └── src/
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Boards.jsx
        │   └── Board.jsx
        ├── components/
        │   └── Toast.jsx
        └── api/
            └── axios.js
```

---

## Deployment

| Service | Purpose |
|---|---|
| [Vercel](https://vercel.com) | Frontend hosting |
| [Render](https://render.com) | Backend hosting |
| [MongoDB Atlas](https://mongodb.com/atlas) | Cloud database |

---

## Author

**Nitish Goel**
- GitHub: [@nitish-goel](https://github.com/nitish-goel)

---

## License

This project is open source and available under the [MIT License](LICENSE).
