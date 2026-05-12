# Vibe — Social Media App

A full-stack Instagram/Facebook-style social network built with the **MERN** stack (MongoDB, Express, React, Node) plus Tailwind CSS v4 and Redux Toolkit.

## Features

- Email/password auth with JWT (register, login, persisted sessions)
- Posts with text + image upload (multer)
- Like / unlike posts
- Comment threads with delete
- Follow / unfollow users + suggestions
- User search (debounced, regex-safe)
- Profile pages with grid + feed views, avatar upload, bio editing
- Stories rail, "For You / Following" filter on feed
- Infinite scroll feed (IntersectionObserver)
- Right rail with suggested users
- Glassmorphism dark UI, fully responsive

## Stack

| Layer | Tech |
| --- | --- |
| Frontend | React, Vite, Redux Toolkit, React Router, Tailwind v4, react-hot-toast, react-icons, axios |
| Backend  | Node.js, Express 5, Mongoose, JWT, bcryptjs, multer, helmet, express-rate-limit, express-validator |
| Database | MongoDB (Atlas or local) |

## Project Structure

```
.
├── backend/
│   ├── config/db.js              # Mongo connection
│   ├── controllers/              # auth, post, user, comment
│   ├── middleware/               # auth, upload, validate, errorHandler
│   ├── models/                   # User, Post, Comment
│   ├── routes/                   # auth, posts, users, comments
│   ├── uploads/                  # uploaded images (gitignored)
│   ├── server.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/axios.js
    │   ├── components/           # Navbar, Sidebar, RightRail, PostCard, CommentSection, LikeButton, CreatePostModal, Loader
    │   ├── hooks/useDebounce.js
    │   ├── pages/                # Feed, Login, Register, Profile, SinglePost
    │   ├── store/                # authSlice, postSlice, store
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    └── package.json
```

## Getting Started

### 1. Backend env

Copy `.env.example` to `backend/.env` and fill in real values:

```env
PORT=5000
MONGO_URI=mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/socialmedia?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRE=7d
NODE_ENV=development
```

> Without a valid `MONGO_URI`, the server will exit on startup. Use a free MongoDB Atlas cluster or run MongoDB locally (`mongodb://127.0.0.1:27017/socialmedia`).

### 2. Install & run

```powershell
# backend
cd backend
npm install
npm run dev          # nodemon on http://localhost:5000

# frontend (new terminal)
cd frontend
npm install
npm run dev          # vite on http://localhost:5173
```

The Vite dev server proxies `/api` and `/uploads` to `http://localhost:5000`.

### 3. Open

Visit http://localhost:5173, register an account, and start posting.

## API Reference (high level)

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | – | Register a new user |
| POST | `/api/auth/login` | – | Log in, returns JWT |
| GET | `/api/auth/me` | ✓ | Current user (with followers/following) |
| GET | `/api/users/search?q=` | ✓ | Search users by name |
| GET | `/api/users/suggestions` | ✓ | Suggested users to follow |
| GET | `/api/users/:id` | ✓ | User profile |
| PUT | `/api/users/profile` | ✓ | Update name, bio, avatar (multipart) |
| PUT | `/api/users/:id/follow` | ✓ | Toggle follow |
| GET | `/api/posts?page=&limit=` | ✓ | Paginated feed |
| POST | `/api/posts` | ✓ | Create post (multipart, optional image) |
| GET | `/api/posts/user/:userId` | ✓ | Posts by user |
| GET | `/api/posts/:id` | ✓ | Single post |
| PUT | `/api/posts/:id` | ✓ | Update post |
| DELETE | `/api/posts/:id` | ✓ | Delete post |
| PUT | `/api/posts/:id/like` | ✓ | Toggle like |
| GET | `/api/posts/:postId/comments` | ✓ | List comments |
| POST | `/api/posts/:postId/comments` | ✓ | Add comment |
| DELETE | `/api/comments/:id` | ✓ | Delete comment |

## Production Build

```powershell
cd frontend
npm run build        # outputs to frontend/dist
```

Serve `frontend/dist` behind any static host and point `/api` to your backend.

## Notes

- Uploaded images are stored on disk under `backend/uploads/`. For production use S3 or similar.
- `helmet` is configured with `crossOriginResourcePolicy: 'cross-origin'` so the frontend can load images from the backend during development.
- Rate limit: 200 requests / 15 min per IP across all routes.
