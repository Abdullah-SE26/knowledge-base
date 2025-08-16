import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: ["user", "admin", "superadmin"],
      default: "user",
    },
    lastLogin: { type: Date },   // updated on successful login
    lastActive: { type: Date },  // updated on login + meaningful activity
  },
  { timestamps: true }
);

// Helpful indexes for faster queries on stats
UserSchema.index({ lastActive: 1 });
UserSchema.index({ lastLogin: 1 });

const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;
