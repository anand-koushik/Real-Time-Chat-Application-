import { Schema, model, Types } from "mongoose";

const notificationSchema = new Schema({
  user: {
    type: Types.ObjectId,
    ref: "user",
    required: [true, "User ID is required"]
  },
  workspace: {
    type: Types.ObjectId,
    ref: "workspace"
  },
  channel: {
    type: Types.ObjectId,
    ref: "channel"
  },
  message: {
    type: Types.ObjectId,
    ref: "message"
  },
  notificationType: {
    type: String,
    enum: ["MESSAGE", "REACTION", "THREAD_REPLY"],
    required: [true, "Notification type is required"]
  },
  text: {
    type: String,
    required: [true, "Notification text is required"]
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  versionKey: false,
  strict: "throw"
});

export const NotificationModel = model("notification", notificationSchema);
