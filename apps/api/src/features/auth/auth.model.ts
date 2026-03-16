import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, required: true, maxlength: 50 },
    avatar: { type: String, required: true },
    bio: { type: String, maxlength: 500 },
    username: {
      type: String,
      unique: true,
      sparse: true,
      maxlength: 30,
      match: /^[a-zA-Z0-9_]{3,30}$/,
    },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
