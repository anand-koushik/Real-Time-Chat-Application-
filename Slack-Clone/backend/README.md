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
  workspace-req.http
  channel-req.http
  message-req.http
```

## 5. Architecture Style

The backend follows a simple Express and Mongoose style.

Each API file exports one Express router:

```js
export const commonApp = exp.Router();
```

The API file contains:

- Route definition
- Middleware usage
- Database logic
- Response sending

Example style:

```js
commonApp.post("/login", async (req, res) => {
  try {
    // logic
    res.status(200).json({ message: "Login successful", payload: user });
  } catch (err) {
    res.status(500).json({ message: "error", error: err.message });
  }
});
```

## 6. Response Format

Success response:

```json
{
  "message": "Success message",
  "payload": {}
}
```

Error response:

```json
{
  "message": "Error message",
  "error": "Error details"
}
```

Some simple responses may only contain `message`, for example login failure or logout success.

## 7. Environment Variables

The `.env` file stores sensitive configuration.

```env
PORT=5000
DB_URL=your_mongodb_connection_string
SECRET_KEY=your_jwt_secret_key
CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

REDIS_URL=redis://localhost:6379
```

Important:

- Never share `.env` publicly.
- Never push real MongoDB URL, JWT secret, or Cloudinary secret to GitHub.
- Restart the server after changing `.env`.

## 8. server.js Explanation

`server.js` is the main entry point of the backend.

It does the following:

1. Imports Express, dotenv, mongoose, cors, cookie-parser, and HTTP server.
2. Imports all API routers.
3. Imports Redis connection.
4. Imports Socket.io initialization.
5. Creates the Express app.
6. Creates an HTTP server for Socket.io.
7. Applies CORS middleware.
8. Applies JSON body parser.
9. Applies cookie parser.
10. Connects path-level APIs.
11. Connects MongoDB.
12. Connects Redis.
13. Initializes Socket.io.
14. Starts the backend server.
15. Handles invalid paths.
16. Handles backend errors.

Path-level API mapping:

```js
app.use("/auth", commonApp);
app.use("/workspace-api", workspaceApp);
app.use("/channel-api", channelApp);
app.use("/dm-api", directMessageApp);
app.use("/message-api", messageApp);
app.use("/notification-api", notificationApp);
```

Why HTTP server is used:

Socket.io needs an HTTP server. That is why we use:

```js
const httpServer = createServer(app);
```

Then Socket.io is initialized using that HTTP server.

## 9. Models Explanation

### 9.1 UserModel.js

The User model stores registered user information.

Main fields:

- `firstName`
- `lastName`
- `email`
- `password`
- `role`
- `profileImageUrl`
- `workspaces`
- `isUserActive`

Purpose:

Users can register, login, join workspaces, send messages, react to messages, and receive notifications.

The password is hashed before saving.

Roles:

- `USER`
- `ADMIN`

The role is used by `verifyToken()`.

### 9.2 WorkspaceModel.js

The Workspace model stores Slack-like workspaces.

Main fields:

- `workspaceName`
- `description`
- `owner`
- `members`
- `isWorkspaceActive`

Each workspace has:

- One owner
- Many members

Each member has:

- `user`
- `role`
- `joinedAt`

Workspace member roles:

- `OWNER`
- `ADMIN`
- `MEMBER`

Purpose:

A workspace is the parent container for channels, messages, direct messages, and notifications.

### 9.3 ChannelModel.js

The Channel model stores channels inside a workspace.

Main fields:

- `workspace`
- `channelName`
- `description`
- `channelType`
- `createdBy`
- `members`
- `isChannelActive`

Channel types:

- `PUBLIC`
- `PRIVATE`

Purpose:

Channels allow workspace members to communicate in groups.

Public channels can be seen by workspace members.

Private channels are only for selected channel members.

### 9.4 MessageModel.js

The Message model is the most important model in the project.

It stores:

- Channel messages
- Direct messages
- File messages
- Reactions
- Edited message status
- Thread replies

Main fields:

- `workspace`
- `channel`
- `sender`
- `receiver`
- `messageType`
- `content`
- `file`
- `reactions`
- `threadReplies`
- `isEdited`
- `isMessageActive`

Message types:

- `CHANNEL`
- `DIRECT`

File object stores:

- `fileUrl`
- `fileName`
- `fileType`
- `fileSize`

Reaction object stores:

- `user`
- `reaction`
- `createdAt`

Thread reply object stores:

- `sender`
- `content`
- `file`
- `createdAt`
- `updatedAt`

Purpose:

This model powers almost all chat features.

### 9.5 NotificationModel.js

The Notification model stores user notifications.

Main fields:

- `user`
- `workspace`
- `channel`
- `message`
- `notificationType`
- `text`
- `isRead`

Notification types:

- `MESSAGE`
- `REACTION`
- `THREAD_REPLY`

Currently notifications are mainly created when a user receives a direct message.

## 10. Middleware Explanation

### VerifyToken.js

This middleware protects private routes.

It does the following:

1. Reads token from cookies or Authorization header.
2. Verifies the token using `SECRET_KEY`.
3. Finds the user in MongoDB.
4. Checks if the user account is active.
5. Checks if the user role is allowed.
6. Stores decoded user data in `req.user`.
7. Allows the request to continue.

Protected route example:

```js
workspaceApp.post("/workspaces", verifyToken("USER", "ADMIN"), async (req, res) => {
  // protected logic
});
```

Authorization header format:

```txt
Authorization: Bearer token_here
```

## 11. Config Folder Explanation

### cloudinary.js

This file configures Cloudinary using environment variables.

Cloudinary is used to store uploaded files.

### cloudinaryUpload.js

This file uploads a file buffer to Cloudinary.

It returns Cloudinary upload result, including the uploaded file URL.

### multer.js

This file configures Multer.

Multer receives files from multipart form data.

We use memory storage, so files are stored temporarily in memory before uploading to Cloudinary.

### redis.js

This file creates and connects a Redis client.

Redis is currently used as a basic structure for online user tracking.

If Redis is not running locally, the backend can still run because Redis connection errors are handled safely.

## 12. API Files Explanation

### 12.1 CommonAPI.js

Purpose:

Handles authentication and common user actions.

Routes:

```txt
POST /auth/users
POST /auth/login
GET  /auth/logout
GET  /auth/check-auth
PUT  /auth/password
```

Details:

`POST /auth/users`

- Registers a new user.
- Hashes password using bcrypt.
- Optionally uploads profile image to Cloudinary.
- Saves user in MongoDB.

`POST /auth/login`

- Checks email and password.
- Creates JWT token.
- Sends token in response.
- Also stores token in cookie.

`GET /auth/logout`

- Clears the token cookie.

`GET /auth/check-auth`

- Checks whether the token is valid.

`PUT /auth/password`

- Checks current password.
- Hashes new password.
- Saves updated password.

### 12.2 WorkspaceAPI.js

Purpose:

Handles workspace-related operations.

Routes:

```txt
POST  /workspace-api/workspaces
GET   /workspace-api/workspaces
GET   /workspace-api/workspace/:id
PUT   /workspace-api/workspace/member
PATCH /workspace-api/workspace/status
```

Details:

`POST /workspace-api/workspaces`

- Creates a new workspace.
- Logged-in user becomes owner.
- Owner is also added as first member.
- Workspace ID is added to user's `workspaces` list.

`GET /workspace-api/workspaces`

- Gets all active workspaces where logged-in user is a member.

`GET /workspace-api/workspace/:id`

- Gets one workspace only if logged-in user is a member.

`PUT /workspace-api/workspace/member`

- Adds an existing registered user to workspace.
- Only workspace owner or workspace admin can add members.

`PATCH /workspace-api/workspace/status`

- Soft deletes or restores workspace.
- Only workspace owner can do this.

### 12.3 ChannelAPI.js

Purpose:

Handles channels inside workspaces.

Routes:

```txt
POST  /channel-api/channels
GET   /channel-api/channels/:workspaceId
GET   /channel-api/channel/:id
PUT   /channel-api/channel/member
PATCH /channel-api/channel/leave
PATCH /channel-api/channel/status
```

Details:

`POST /channel-api/channels`

- Creates a channel inside a workspace.
- User must be a workspace member.
- Creator is automatically added as channel member.

`GET /channel-api/channels/:workspaceId`

- Gets active public channels.
- Also gets private channels where logged-in user is a member.

`GET /channel-api/channel/:id`

- Gets one channel.
- Checks workspace membership.
- Checks private channel membership.

`PUT /channel-api/channel/member`

- Adds a user to a channel.
- User must already be a workspace member.
- Only workspace owner or channel creator can add members.

`PATCH /channel-api/channel/leave`

- Removes logged-in user from channel members.

`PATCH /channel-api/channel/status`

- Soft deletes or restores a channel.
- Only channel creator can do this.

### 12.4 DirectMessageAPI.js

Purpose:

Handles direct message fetching and direct message user lists.

Routes:

```txt
GET /dm-api/users/:workspaceId
GET /dm-api/messages/:workspaceId/:receiverId
GET /dm-api/conversations/:workspaceId
```

Details:

`GET /dm-api/users/:workspaceId`

- Gets workspace users available for direct messages.
- Excludes logged-in user.

`GET /dm-api/messages/:workspaceId/:receiverId`

- Gets messages between logged-in user and receiver.
- Both users must belong to the workspace.

`GET /dm-api/conversations/:workspaceId`

- Gets recent direct message conversations for logged-in user.

### 12.5 MessageAPI.js

Purpose:

Handles the main chat message features.

Routes:

```txt
POST  /message-api/channel-message
POST  /message-api/direct-message
POST  /message-api/file-message
GET   /message-api/channel-messages/:channelId
PUT   /message-api/message
PUT   /message-api/message/reaction
PATCH /message-api/message/reaction
PUT   /message-api/message/thread
GET   /message-api/message/thread/:messageId
PATCH /message-api/message/status
```

Details:

`POST /message-api/channel-message`

- Sends message to a channel.
- Checks channel exists.
- Checks workspace membership.
- Checks private channel membership if needed.
- Saves message with `messageType: "CHANNEL"`.

`POST /message-api/direct-message`

- Sends direct message to another user.
- Checks both users are in the same workspace.
- Saves message with `messageType: "DIRECT"`.
- Creates notification for receiver.

`POST /message-api/file-message`

- Receives file using Multer.
- Uploads file to Cloudinary.
- Saves file URL and file details inside Message model.

`GET /message-api/channel-messages/:channelId`

- Gets active messages of a channel.
- Populates sender, reactions, and thread replies.

`PUT /message-api/message`

- Edits own message.
- Only sender can edit.
- Sets `isEdited` to true.

`PUT /message-api/message/reaction`

- Adds or updates logged-in user's reaction on a message.

`PATCH /message-api/message/reaction`

- Removes logged-in user's reaction from a message.

`PUT /message-api/message/thread`

- Adds a thread reply to a message.

`GET /message-api/message/thread/:messageId`

- Gets all thread replies of a message.

`PATCH /message-api/message/status`

- Soft deletes or restores own message.

### 12.6 NotificationAPI.js

Purpose:

Handles notification fetching and read status.

Routes:

```txt
GET   /notification-api/notifications
PATCH /notification-api/notification/read
PATCH /notification-api/notifications/read
```

Details:

`GET /notification-api/notifications`

- Gets notifications of logged-in user.

`PATCH /notification-api/notification/read`

- Marks one notification as read.

`PATCH /notification-api/notifications/read`

- Marks all unread notifications as read.

## 13. Socket.io Structure

Socket files:

```txt
sockets/
  socket.js
  socketEvents.js
```

### 13.1 socket.js

Purpose:

Initializes Socket.io and authenticates socket users.

It does:

1. Creates Socket.io server.
2. Reads token from socket auth, header, or cookie.
3. Verifies JWT.
4. Checks user exists.
5. Checks user is active.
6. Attaches user to socket.
7. Joins personal user room.
8. Stores online user in Redis if Redis is running.
9. Emits online/offline events.
10. Registers socket events.

User room format:

```txt
user-userId
```

### 13.2 socketEvents.js

Purpose:

Contains real-time chat events.

Events:

```txt
join-workspace
workspace-joined

join-channel
channel-joined

join-direct-message
direct-message-joined

send-message
receive-message

edit-message
message-edited

add-reaction
reaction-added

remove-reaction
reaction-removed

thread-reply
thread-reply-added

file-shared
receive-file

socket-error
```

Room formats:

```txt
workspace-workspaceId
channel-channelId
dm-userId1-userId2
user-userId
```

Important frontend note:

REST APIs and Socket.io both support message creation flow in this backend. The frontend should use one consistent creation approach to avoid duplicate messages.

Recommended simple approach:

- Use REST API to save data.
- Use Socket.io to notify the UI in real time.

## 14. Main Application Flows

### 14.1 Register Flow

1. Client sends user details to `/auth/users`.
2. Backend hashes password.
3. Optional profile image is uploaded to Cloudinary.
4. User is saved in MongoDB.
5. Backend sends success response.

### 14.2 Login Flow

1. Client sends email and password to `/auth/login`.
2. Backend finds user by email.
3. Backend compares password using bcrypt.
4. Backend creates JWT token.
5. Token is returned in response.
6. Token is also stored in cookie.

### 14.3 Protected Route Flow

1. Client sends token in Authorization header.
2. `verifyToken()` checks token.
3. User is found from MongoDB.
4. User active status is checked.
5. Role is checked.
6. Route logic runs.

### 14.4 Workspace Flow

1. User creates workspace.
2. User becomes owner.
3. Owner is added as first workspace member.
4. Owner can add other registered users.

### 14.5 Channel Flow

1. Workspace member creates channel.
2. Channel belongs to one workspace.
3. Public channels are visible to workspace members.
4. Private channels are visible only to selected members.

### 14.6 Channel Message Flow

1. User sends channel message.
2. Backend checks channel and workspace membership.
3. Message is saved in MongoDB.
4. Socket.io can emit message to channel room.

### 14.7 Direct Message Flow

1. User selects another workspace member.
2. User sends direct message.
3. Backend checks both users are in same workspace.
4. Message is saved in MongoDB.
5. Notification is created for receiver.
6. Socket.io can emit message to direct message room.

### 14.8 File Sharing Flow

1. Client sends multipart form-data with file.
2. Multer receives file in memory.
3. Cloudinary uploads file.
4. Cloudinary URL is saved in Message model.
5. Message is returned to client.

### 14.9 Reaction Flow

1. User reacts to a message.
2. Backend checks if user already reacted.
3. If yes, reaction is updated.
4. If no, reaction is added.
5. Message is saved.

### 14.10 Thread Reply Flow

1. User replies inside a message thread.
2. Reply is pushed into `threadReplies`.
3. Message is saved.
4. Socket.io can notify channel or direct message room.

### 14.11 Notification Flow

1. User sends direct message.
2. Backend creates notification for receiver.
3. Receiver fetches notifications.
4. Receiver can mark one or all notifications as read.

## 15. Request File Testing Order

Use the `.http` files in this order.

### Step 1: user-req.http

Test:

- Register user
- Register admin
- Login user
- Login admin
- Check auth
- Change password
- Logout

Important:

Copy token from login response and use:

```txt
Authorization: Bearer token_here
```

### Step 2: workspace-req.http

Test:

- Create workspace
- Get workspaces
- Get single workspace
- Add member
- Soft delete workspace
- Restore workspace

Important:

The user being added must already be registered.

### Step 3: channel-req.http

Test:

- Create public channel
- Create private channel
- Get channels
- Get single channel
- Add member to channel
- Leave channel
- Soft delete channel
- Restore channel

Important:

Use the correct workspace ID from workspace response.

### Step 4: message-req.http

Test:

- Send channel message
- Get channel messages
- Send direct message
- Get direct messages
- Send file message
- Edit message
- Add reaction
- Remove reaction
- Add thread reply
- Get thread replies
- Soft delete message
- Restore message
- Get notifications
- Mark notification as read

Important:

Notifications are created for the receiver of a direct message, not the sender.

## 16. Common Errors And Fixes

### Error: Invalid email or password

Reason:

The email or password is wrong.

Common case:

Password was changed earlier, so old password no longer works.

Fix:

Login with the latest password.

### Error: Please login

Reason:

Token is missing.

Fix:

Add Authorization header:

```txt
Authorization: Bearer token_here
```

### Error: Invalid token

Reason:

Token is wrong, expired, or copied incorrectly.

Fix:

Login again and use new token.

### Error: User not found while adding workspace member

Reason:

The email does not exist in MongoDB.

Fix:

Register that user first, then add to workspace.

### Error: Workspace not found

Reason:

Wrong workspace ID, inactive workspace, or logged-in user is not a member.

Fix:

Run `GET /workspace-api/workspaces` and copy the correct workspace ID.

### Error: Unknown API key your_api_key

Reason:

Cloudinary `.env` still has placeholder values.

Fix:

Use real Cloudinary credentials and restart server.

### Redis ECONNREFUSED

Reason:

Redis is not running locally.

Fix:

Either start Redis or ignore it for now. Backend can still run if Redis error is caught.

### Notifications payload is empty

Reason:

Logged-in user has no notifications.

Common case:

You are checking notifications using sender token instead of receiver token.

Fix:

Login as the receiver and call notifications API.

## 17. Mentor Questions And Answers

### What is this project?

It is the backend of a real-time Slack-like chat application where users can communicate inside workspaces using channels and direct messages.

### Why did we use Express?

Express gives us a simple way to create APIs for authentication, workspaces, channels, messages, and notifications.

### Why did we use MongoDB?

MongoDB stores flexible document-based data like users, workspaces, channels, messages, reactions, and thread replies.

### Why did we use Mongoose?

Mongoose helps define schemas, validations, relations using refs, and easy database operations.

### Why did we use JWT?

JWT is used for authentication. After login, the user gets a token. Protected APIs verify this token before allowing access.

### Why did we use bcryptjs?

bcryptjs is used to hash passwords so plain passwords are not stored in MongoDB.

### Why did we use Socket.io?

Socket.io is used for real-time communication. It allows messages, edits, reactions, and replies to appear instantly without page refresh.

### Why did we use Redis?

Redis is added as basic structure for online user tracking and future scalability. It can later help with presence and Socket.io scaling.

### Why did we use Cloudinary?

Cloudinary stores uploaded files and gives us a secure file URL that can be saved in MongoDB.

### Why did we use Multer?

Multer receives files from client requests before uploading them to Cloudinary.

### What is the difference between REST APIs and Socket.io?

REST APIs are used to save, fetch, update, and delete data. Socket.io is used to send real-time updates to connected users instantly.

### Why did we not create controllers and services?

We followed the same structure as the blog backend. In this project, each API file contains routes and logic together to keep the backend simple and consistent.

### How are messages stored?

Messages are stored in `MessageModel`. The same model handles channel messages, direct messages, file messages, reactions, edits, and thread replies.

### How are direct messages separated?

Direct messages have `messageType: "DIRECT"` and store both `sender` and `receiver`.

### How are channel messages separated?

Channel messages have `messageType: "CHANNEL"` and store the `channel` ID.

### How do thread replies work?

Thread replies are stored as an array inside the parent message document.

### How do reactions work?

Reactions are stored as an array inside the message document. One user can add or update their reaction.

### How does soft delete work?

We do not permanently delete records. We update active status fields like `isWorkspaceActive`, `isChannelActive`, or `isMessageActive`.

## 18. What We Have Not Added

We did not add unnecessary features.

Not included:

- Video calls
- Voice calls
- Advanced search
- Message pinning
- Workspace invitations by email
- Read receipts
- Typing indicators
- Admin dashboard
- Advanced Redis pub/sub scaling

These can be future improvements.

## 19. Final Summary

This backend is a clean, simple, blog-style MERN backend for a Slack-like real-time chat app.

It uses:

- Express for APIs
- MongoDB and Mongoose for database
- JWT and bcryptjs for authentication
- Multer and Cloudinary for file sharing
- Socket.io for real-time updates
- Redis basic setup for presence structure

The backend is organized around:

- Users
- Workspaces
- Channels
- Messages
- Notifications
- Sockets

Every file has a clear role, every feature is connected to a model and API, and the structure is easy to explain, test, and extend.



**Natural Project Explanation**

We are building a real-time chat app, like a small Slack clone. The idea is that a team can come into our app, create a workspace, create channels inside that workspace, chat with each other, send files, react to messages, edit messages, reply in threads, and get notifications.

Think of it like a company office.

A **workspace** is like the company building.

A **channel** is like a room inside that building, for example `general`, `project-team`, or `announcements`.

A **direct message** is like two people privately talking outside the group room.

A **message** is anything someone sends: text, file, reaction, or thread reply.

**How The App Flow Works**

First, a user registers. For example, `user1` creates an account. We save their details, but we do not save the password directly. We lock it using hashing.

Then the user logs in. If the email and password are correct, we give them a token. That token is like an ID card. Whenever they want to create a workspace, send a message, or react, they show this token to prove who they are.

Then `user1` creates a workspace, maybe called `Team Workspace`. Since `user1` created it, they become the owner of that workspace.

Now `user1` can add another registered user, like `user2`, into the workspace. But `user2` must already have an account. We cannot add a random email that does not exist.

After that, users can create channels. For example, `user1` creates a `general` channel. Now the team can talk inside that channel.

When someone sends a channel message, the backend first checks: “Is this user logged in? Is this user part of this workspace? Is this channel active? If it is a private channel, is this user allowed inside?” If everything is okay, the message is saved.

For real-time behavior, Socket.io helps. So when `user1` sends a message, the other users in that channel can receive it instantly without refreshing the page.

**Direct Message Example**

Suppose `user1` wants to privately message `user2`.

The backend checks if both users are in the same workspace. If yes, it saves the direct message. Then it creates a notification for `user2`.

So if `user1` sends the message, `user1` does not get the notification. `user2` gets it because `user2` is the receiver.

That is why, when testing notifications, we must login as the receiver user.

**Reactions**

If `user2` likes a message from `user1`, we store that reaction inside the message. If `user2` changes the reaction, we update the old reaction instead of creating duplicates.

So practically, one user can react to a message, and that reaction belongs to that user.

**Message Editing**

If a user sends a message and later wants to correct it, they can edit it.

But only the sender can edit their own message. So if `user1` sends a message, `user2` cannot edit it.

When edited, we mark the message as edited, so the frontend can show something like “edited.”

**Thread Replies**

Thread replies are like replying under one specific message.

For example, someone sends:

```txt
Please review the design.
```

Instead of disturbing the whole channel, teammates can reply inside that message thread.

So the original message remains the parent message, and replies are stored under it.

**File Sharing**

If someone uploads a file, the file does not stay directly inside MongoDB.

The backend receives the file, sends it to Cloudinary, gets a file URL, and saves that URL in the message.

So MongoDB stores the file information, but Cloudinary stores the actual file.

**Redis**

Redis is only a basic support system right now.

You can explain it like this: Redis is like a quick attendance board. It can help us track who is online. If Redis is not running, our main backend still works. MongoDB, APIs, and chat features still run.

**Simple Demo Story**

You can explain to your team like this:

“Let’s say user1 registers and logs in. Then user1 creates a workspace called Team Workspace. Since user1 created it, user1 becomes the owner. Then user2 registers, and user1 adds user2 into the workspace. After that, user1 creates a general channel. Now both users can chat in that channel. user1 can send a message, user2 can react to it, user1 can edit it, and user2 can reply in a thread. If user1 sends a private direct message to user2, user2 gets a notification. If someone shares a file, the backend uploads it to Cloudinary and saves the file link in MongoDB.”

That is the project in a natural way.

**Best One-Line Explanation**

“We built the backend brain of a Slack-like chat app where users can log in, join workspaces, talk in channels or direct messages, share files, react, edit messages, reply in threads, and receive notifications in real time.”