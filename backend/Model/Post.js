const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    caption: { type: String, default: "", trim: true, maxlength: 2000 },
    media: [{ type: String }],
    mediaType: {
      type: String,
      enum: ["image", "video", "mixed"],
      required: true,
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    shares: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

postSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);
