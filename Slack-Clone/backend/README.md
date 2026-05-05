# Real-Time Chat Application Backend Documentation

## 1. Project Overview

This backend is built for a Real-Time Chat Application, similar to a simple Slack clone.

The main purpose of the backend is to allow users to communicate inside workspaces using channels and direct messages. It also supports file sharing, reactions, message editing, thread replies, notifications, and real-time updates.

This backend follows the same simple structure as the blog application backend:

- No controllers folder
- No services folder
- API files contain both routes and logic
- Mongoose models are stored separately
- Middleware is simple and reusable
- Response format stays consistent

## 2. Features Implemented

The backend supports only these required features:

- User authentication
- Workspaces
- Channels
- Direct messages
- File sharing
- Message reactions
- Message editing
- Thread replies
- Notifications
- Socket.io real-time communication
- Redis basic setup for online user structure

## 3. Tech Stack

Backend technologies:

- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.io
- Redis
- JWT
- bcryptjs
- Multer
- Cloudinary
- dotenv
- cors
- cookie-parser

Frontend technology:

- React

React is not inside the backend. The backend exposes APIs and Socket.io events for the React frontend to use.

## 4. Backend Folder Structure

```txt
backend/
  server.js
  package.json
  package-lock.json
  .env
  README.md

  APIs/
    CommonAPI.js
    WorkspaceAPI.js
    ChannelAPI.js
    DirectMessageAPI.js
    MessageAPI.js
    NotificationAPI.js

  models/
    UserModel.js
    WorkspaceModel.js
    ChannelModel.js
    MessageModel.js
    NotificationModel.js

  middlewares/
    VerifyToken.js

  config/
    cloudinary.js
    cloudinaryUpload.js
    multer.js
    redis.js

  sockets/
    socket.js
    socketEvents.js

  user-req.http
  workspace-req.http=
  channel-req.http
  message-req.http
``
