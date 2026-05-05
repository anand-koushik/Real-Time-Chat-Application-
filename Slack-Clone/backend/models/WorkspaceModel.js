import { Schema, model, Types } from "mongoose";

const memberSchema = new Schema({
  user: {
    type: Types.ObjectId,
    ref: "user",
    required: [true, "User ID required"]
  },
  role: {
    type: String,
    enum: ["OWNER", "ADMIN", "MEMBER"],
    default: "MEMBER"
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

const workspaceSchema = new Schema({
  workspaceName: {
    type: String,
    required: [true, "Workspace name is required"]
  },
  description: {
    type: String
  },
  owner: {
    type: Types.ObjectId,
    ref: "user",
    required: [true, "Owner ID is required"]
  },
  members: {
    type: [memberSchema],
    default: []
  },
  isWorkspaceActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  versionKey: false,
  strict: "throw"
});

export const WorkspaceModel = model("workspace", workspaceSchema);
