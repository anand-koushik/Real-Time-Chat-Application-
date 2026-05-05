import { Schema, model, Types } from "mongoose";

const userSchema = new Schema({
  firstName: {
    type: String,
    required: [true, "First name is required"]
  },
  lastName: {
    type: String
  },
  email: {
    type: String,
    required: [true, "Email required"],
    unique: [true, "Email already exists"]
  },
  password: {
    type: String,
    required: [true, "Password required"]
  },
  role: {
    type: String,
    enum: ["USER", "ADMIN"],
    required: [true, "{VALUE} is an invalid role"]
  },
  profileImageUrl: {
    type: String
  },
  workspaces: [{
    type: Types.ObjectId,
    ref: "workspace"
  }],
  isUserActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  versionKey: false,
  strict: "throw"
});

export const UserModel = model("user", userSchema);
