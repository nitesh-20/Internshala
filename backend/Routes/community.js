const express = require("express");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const User = require("../Model/User");
const Post = require("../Model/Post");
const Comment = require("../Model/Comment");
const FriendRequest = require("../Model/FriendRequest");
const { requireAuth } = require("../middleware/auth");
const { validatePostingLimit } = require("../services/postingLimits");

const router = express.Router();

const writeLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 40,
  message: { error: "Too many community actions. Please try again later." },
});

const sanitizeUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email || "",
  phoneNumber: user.phone || "",
  photo: user.photo || "",
  authProvider: user.authProvider,
  friendCount: user.friendCount || 0,
});

const formatPost = (post, authUserId) => {
  const likeIds = (post.likes || []).map((id) => String(id));
  return {
    id: String(post._id),
    caption: post.caption,
    media: post.media || [],
    mediaType: post.mediaType,
    likes: likeIds.length,
    likedByCurrentUser: authUserId ? likeIds.includes(String(authUserId)) : false,
    comments: Array.isArray(post.comments) ? post.comments.length : 0,
    shares: post.shares || 0,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    user: post.userId && post.userId._id ? sanitizeUser(post.userId) : null,
  };
};

const getPagination = (req) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
};

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.authUser._id)
      .populate({
        path: "friends",
        select: "name email phone photo authProvider friendCount",
      })
      .populate({
        path: "friendRequests",
        populate: { path: "sender", select: "name email phone photo authProvider friendCount" },
      })
      .populate({
        path: "sentRequests",
        populate: { path: "receiver", select: "name email phone photo authProvider friendCount" },
      });

    return res.json({
      user: sanitizeUser(user),
      friends: (user.friends || []).map(sanitizeUser),
      friendRequests: (user.friendRequests || [])
        .filter((request) => request.status === "pending")
        .map((request) => ({
          id: String(request._id),
          status: request.status,
          sender: request.sender ? sanitizeUser(request.sender) : null,
          createdAt: request.createdAt,
        })),
      sentRequests: (user.sentRequests || [])
        .filter((request) => request.status === "pending")
        .map((request) => ({
          id: String(request._id),
          status: request.status,
          receiver: request.receiver ? sanitizeUser(request.receiver) : null,
          createdAt: request.createdAt,
        })),
    });
  } catch (error) {
    console.error("Community Me Error:", error);
    return res.status(500).json({ error: "Failed to load community profile." });
  }
});

router.get("/feed", requireAuth, async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const posts = await Post.find()
      .populate("userId", "name email phone photo authProvider friendCount")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await Post.countDocuments();

    return res.json({
      posts: posts.map((post) => formatPost(post, req.authUser._id)),
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + posts.length < total,
      },
    });
  } catch (error) {
    console.error("Community Feed Error:", error);
    return res.status(500).json({ error: "Failed to load feed." });
  }
});

router.get("/posts/user/:userId", requireAuth, async (req, res) => {
  try {
    const posts = await Post.find({ userId: req.params.userId })
      .populate("userId", "name email phone photo authProvider friendCount")
      .sort({ createdAt: -1 });

    return res.json({ posts: posts.map((post) => formatPost(post, req.authUser._id)) });
  } catch (error) {
    console.error("User Posts Error:", error);
    return res.status(500).json({ error: "Failed to load user posts." });
  }
});

router.post("/posts", requireAuth, writeLimiter, async (req, res) => {
  try {
    const { caption = "", media = [], mediaType } = req.body;

    if (!caption.trim() && (!Array.isArray(media) || media.length === 0)) {
      return res.status(400).json({ error: "Add a caption or at least one media file." });
    }

    if (media.length > 0 && !["image", "video", "mixed"].includes(mediaType)) {
      return res.status(400).json({ error: "Invalid media type." });
    }

    const user = await User.findById(req.authUser._id);
    if (!user) {
      return res.status(404).json({ error: "User profile not found. Please log in again to sync your account." });
    }
    const limitCheck = await validatePostingLimit(user._id, user.friendCount || 0);
    if (!limitCheck.allowed) {
      return res.status(403).json({ error: limitCheck.message });
    }

    const post = await Post.create({
      userId: user._id,
      caption: caption.trim(),
      media,
      mediaType,
      likes: [],
      comments: [],
      shares: 0,
    });

    await post.populate("userId", "name email phone photo authProvider friendCount");
    return res.status(201).json({
      message: "Post created successfully.",
      post: formatPost(post, req.authUser._id),
    });
  } catch (error) {
    console.error("Create Post Error:", error);
    return res.status(500).json({ error: "Failed to create post." });
  }
});

router.put("/posts/:postId", requireAuth, writeLimiter, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    if (String(post.userId) !== String(req.authUser._id)) {
      return res.status(403).json({ error: "You can edit only your own posts." });
    }

    const { caption = post.caption, media = post.media, mediaType = post.mediaType } = req.body;
    post.caption = String(caption || "").trim();
    post.media = Array.isArray(media) ? media : post.media;
    post.mediaType = mediaType || post.mediaType;
    await post.save();
    await post.populate("userId", "name email phone photo authProvider friendCount");

    return res.json({
      message: "Post updated successfully.",
      post: formatPost(post, req.authUser._id),
    });
  } catch (error) {
    console.error("Edit Post Error:", error);
    return res.status(500).json({ error: "Failed to update post." });
  }
});

router.delete("/posts/:postId", requireAuth, writeLimiter, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    if (String(post.userId) !== String(req.authUser._id)) {
      return res.status(403).json({ error: "You can delete only your own posts." });
    }

    await Comment.deleteMany({ postId: post._id });
    await Post.deleteOne({ _id: post._id });

    return res.json({ message: "Post deleted successfully." });
  } catch (error) {
    console.error("Delete Post Error:", error);
    return res.status(500).json({ error: "Failed to delete post." });
  }
});

router.post("/posts/:postId/like", requireAuth, writeLimiter, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    const authUserId = String(req.authUser._id);
    const alreadyLiked = post.likes.some((id) => String(id) === authUserId);
    if (!alreadyLiked) {
      post.likes.push(req.authUser._id);
      await post.save();
    }

    return res.json({ message: "Post liked.", likes: post.likes.length });
  } catch (error) {
    console.error("Like Post Error:", error);
    return res.status(500).json({ error: "Failed to like post." });
  }
});

router.delete("/posts/:postId/like", requireAuth, writeLimiter, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    post.likes = post.likes.filter((id) => String(id) !== String(req.authUser._id));
    await post.save();
    return res.json({ message: "Post unliked.", likes: post.likes.length });
  } catch (error) {
    console.error("Unlike Post Error:", error);
    return res.status(500).json({ error: "Failed to unlike post." });
  }
});

router.get("/posts/:postId/comments", requireAuth, async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId })
      .populate("userId", "name email phone photo authProvider friendCount")
      .sort({ createdAt: 1 });

    return res.json({
      comments: comments.map((comment) => ({
        id: String(comment._id),
        postId: String(comment.postId),
        comment: comment.comment,
        createdAt: comment.createdAt,
        user: comment.userId ? sanitizeUser(comment.userId) : null,
        isOwner: String(comment.userId?._id || comment.userId) === String(req.authUser._id),
      })),
    });
  } catch (error) {
    console.error("Get Comments Error:", error);
    return res.status(500).json({ error: "Failed to load comments." });
  }
});

router.post("/posts/:postId/comments", requireAuth, writeLimiter, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    const commentText = String(req.body.comment || "").trim();
    if (!commentText) {
      return res.status(400).json({ error: "Comment is required." });
    }

    const comment = await Comment.create({
      postId: post._id,
      userId: req.authUser._id,
      comment: commentText,
    });

    post.comments.push(comment._id);
    await post.save();
    await comment.populate("userId", "name email phone photo authProvider friendCount");

    return res.status(201).json({
      message: "Comment added successfully.",
      comment: {
        id: String(comment._id),
        postId: String(comment.postId),
        comment: comment.comment,
        createdAt: comment.createdAt,
        user: sanitizeUser(comment.userId),
        isOwner: true,
      },
    });
  } catch (error) {
    console.error("Add Comment Error:", error);
    return res.status(500).json({ error: "Failed to add comment." });
  }
});

router.delete("/comments/:commentId", requireAuth, writeLimiter, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found." });
    }

    if (String(comment.userId) !== String(req.authUser._id)) {
      return res.status(403).json({ error: "You can delete only your own comments." });
    }

    await Comment.deleteOne({ _id: comment._id });
    await Post.findByIdAndUpdate(comment.postId, {
      $pull: { comments: comment._id },
    });

    return res.json({ message: "Comment deleted successfully." });
  } catch (error) {
    console.error("Delete Comment Error:", error);
    return res.status(500).json({ error: "Failed to delete comment." });
  }
});

router.post("/posts/:postId/share", requireAuth, writeLimiter, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    post.shares += 1;
    await post.save();

    return res.json({ message: "Post shared.", shares: post.shares });
  } catch (error) {
    console.error("Share Post Error:", error);
    return res.status(500).json({ error: "Failed to share post." });
  }
});

router.get("/friends", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.authUser._id).populate(
      "friends",
      "name email phone photo authProvider friendCount"
    );

    return res.json({
      friends: (user.friends || []).map(sanitizeUser),
      friendCount: user.friendCount || 0,
    });
  } catch (error) {
    console.error("Friend List Error:", error);
    return res.status(500).json({ error: "Failed to load friends." });
  }
});

router.get("/users/search", requireAuth, async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    const currentUser = await User.findById(req.authUser._id)
      .populate("friends", "_id")
      .populate("friendRequests", "_id sender receiver status")
      .populate("sentRequests", "_id sender receiver status");

    const conditions = { _id: { $ne: currentUser._id } };
    if (query) {
      conditions.$or = [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } },
      ];
    }

    const users = await User.find(conditions)
      .sort({ createdAt: -1 })
      .limit(12);

    const friendIds = new Set((currentUser.friends || []).map((friend) => String(friend._id || friend)));
    const incomingMap = new Map(
      (currentUser.friendRequests || []).map((request) => [String(request.sender), String(request._id)])
    );
    const outgoingMap = new Map(
      (currentUser.sentRequests || []).map((request) => [String(request.receiver), String(request._id)])
    );

    return res.json({
      users: users.map((user) => ({
        ...sanitizeUser(user),
        relationship:
          friendIds.has(String(user._id))
            ? "friend"
            : incomingMap.has(String(user._id))
            ? "incoming"
            : outgoingMap.has(String(user._id))
            ? "outgoing"
            : "none",
      })),
    });
  } catch (error) {
    console.error("Search Users Error:", error);
    return res.status(500).json({ error: "Failed to search users." });
  }
});

router.post("/friends/request", requireAuth, writeLimiter, async (req, res) => {
  try {
    const receiverId = req.body.receiverId;
    if (!receiverId || !mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ error: "Valid receiverId is required." });
    }

    if (String(receiverId) === String(req.authUser._id)) {
      return res.status(400).json({ error: "You cannot send a friend request to yourself." });
    }

    const sender = await User.findById(req.authUser._id);
    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({ error: "Receiver not found." });
    }

    if (sender.friends.some((id) => String(id) === String(receiverId))) {
      return res.status(409).json({ error: "You are already friends." });
    }

    const existingRequest = await FriendRequest.findOne({
      sender: req.authUser._id,
      receiver: receiverId,
      status: "pending",
    });
    if (existingRequest) {
      return res.status(409).json({ error: "Friend request already sent." });
    }

    const reverseRequest = await FriendRequest.findOne({
      sender: receiverId,
      receiver: req.authUser._id,
      status: "pending",
    });
    if (reverseRequest) {
      return res.status(409).json({ error: "This user has already sent you a request." });
    }

    const request = await FriendRequest.create({
      sender: req.authUser._id,
      receiver: receiverId,
      status: "pending",
    });

    sender.sentRequests.push(request._id);
    receiver.friendRequests.push(request._id);
    await sender.save();
    await receiver.save();

    return res.status(201).json({ message: "Friend request sent successfully." });
  } catch (error) {
    console.error("Send Friend Request Error:", error);
    return res.status(500).json({ error: "Failed to send friend request." });
  }
});

router.post("/friends/request/:requestId/accept", requireAuth, writeLimiter, async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.requestId);
    if (!request || request.status !== "pending") {
      return res.status(404).json({ error: "Friend request not found." });
    }

    if (String(request.receiver) !== String(req.authUser._id)) {
      return res.status(403).json({ error: "You can accept only your own incoming requests." });
    }

    request.status = "accepted";
    await request.save();

    const sender = await User.findById(request.sender);
    const receiver = await User.findById(request.receiver);

    if (!sender.friends.some((id) => String(id) === String(receiver._id))) {
      sender.friends.push(receiver._id);
    }
    if (!receiver.friends.some((id) => String(id) === String(sender._id))) {
      receiver.friends.push(sender._id);
    }

    sender.friendCount = sender.friends.length;
    receiver.friendCount = receiver.friends.length;

    sender.sentRequests = sender.sentRequests.filter((id) => String(id) !== String(request._id));
    receiver.friendRequests = receiver.friendRequests.filter((id) => String(id) !== String(request._id));

    await sender.save();
    await receiver.save();
    await FriendRequest.deleteOne({ _id: request._id });

    return res.json({ message: "Friend request accepted." });
  } catch (error) {
    console.error("Accept Friend Request Error:", error);
    return res.status(500).json({ error: "Failed to accept friend request." });
  }
});

router.post("/friends/request/:requestId/reject", requireAuth, writeLimiter, async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.requestId);
    if (!request || request.status !== "pending") {
      return res.status(404).json({ error: "Friend request not found." });
    }

    if (String(request.receiver) !== String(req.authUser._id)) {
      return res.status(403).json({ error: "You can reject only your own incoming requests." });
    }

    const sender = await User.findById(request.sender);
    const receiver = await User.findById(request.receiver);

    sender.sentRequests = sender.sentRequests.filter((id) => String(id) !== String(request._id));
    receiver.friendRequests = receiver.friendRequests.filter((id) => String(id) !== String(request._id));
    await sender.save();
    await receiver.save();

    request.status = "rejected";
    await request.deleteOne();

    return res.json({ message: "Friend request rejected." });
  } catch (error) {
    console.error("Reject Friend Request Error:", error);
    return res.status(500).json({ error: "Failed to reject friend request." });
  }
});

router.delete("/friends/:friendId", requireAuth, writeLimiter, async (req, res) => {
  try {
    const friendId = req.params.friendId;
    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      return res.status(400).json({ error: "Invalid friend id." });
    }

    const user = await User.findById(req.authUser._id);
    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({ error: "Friend not found." });
    }

    user.friends = user.friends.filter((id) => String(id) !== String(friendId));
    friend.friends = friend.friends.filter((id) => String(id) !== String(user._id));
    user.friendCount = user.friends.length;
    friend.friendCount = friend.friends.length;
    await user.save();
    await friend.save();

    return res.json({ message: "Friend removed successfully." });
  } catch (error) {
    console.error("Remove Friend Error:", error);
    return res.status(500).json({ error: "Failed to remove friend." });
  }
});

module.exports = router;
