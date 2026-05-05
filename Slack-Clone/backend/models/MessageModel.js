import { Schema, model, Types } from "mongoose";

const fileSchema = new Schema({
  fileUrl: {
    type: String
  },
  fileName: {
    type: String
  },
  fileType: {
    type: String
  },
  fileSize: {
    type: Number
  }
});

const reactionSchema = new Schema({
  user: {
    type: Types.ObjectId,
    ref: "user",
    required: [true, "User ID required"]
  },
  reaction: {
    type: String,
    required: [true, "Reaction is required"]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const threadReplySchema = new Schema({
  sender: {
    type: Types.ObjectId,
    ref: "user",
    required: [true, "Sender ID required"]
  },
  content: {
    type: String
  },
  file: {
    type: fileSchema,
    default: null
  }
}, {
  timestamps: true,
  versionKey: false
});

const messageSchema = new Schema({
  workspace: {
    type: Types.ObjectId,
    ref: "workspace",
    required: [true, "Workspace ID is required"]
  },
  channel: {
    type: Types.ObjectId,
    ref: "channel"
  },
  sender: {
    type: Types.ObjectId,
    ref: "user",
    required: [true, "Sender ID is required"]
  },
  receiver: {
    type: Types.ObjectId,
    ref: "user"
  },
  messageType: {
    type: String,
    enum: ["CHANNEL", "DIRECT"],
    required: [true, "Message type is required"]
  },
  content: {
    type: String
  },
  file: {
    type: fileSchema,
    default: null
  },
  reactions: {
    type: [reactionSchema],
    default: []
  },
  threadReplies: {
    type: [threadReplySchema],
    default: []
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  isMessageActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  versionKey: false,
  strict: "throw"
});

export const MessageModel = model("message", messageSchema);
