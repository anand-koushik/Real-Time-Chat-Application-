import { Schema, model, Types } from "mongoose";

const channelSchema = new Schema({
  workspace: {
    type: Types.ObjectId,
    ref: "workspace",
    required: [true, "Workspace ID is required"]
  },
  channelName: {
    type: String,
    required: [true, "Channel name is required"]
  },
  description: {
    type: String
  },
  channelType: {
    type: String,
    enum: ["PUBLIC", "PRIVATE"],
    default: "PUBLIC"
  },
  createdBy: {
    type: Types.ObjectId,
    ref: "user",
    required: [true, "Created by user ID is required"]
  },
  members: [{
    type: Types.ObjectId,
    ref: "user"
  }],
  isChannelActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  versionKey: false,
  strict: "throw"
});

export const ChannelModel = model("channel", channelSchema);
