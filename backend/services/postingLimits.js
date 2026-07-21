const Post = require("../Model/Post");

const DAY_MS = 24 * 60 * 60 * 1000;

const getDailyPostLimit = (friendCount) => {
  if (friendCount <= 0) return 0;
  if (friendCount > 10) return Infinity;
  if (friendCount === 1) return 1;
  if (friendCount === 2) return 2;
  return friendCount;
};

const validatePostingLimit = async (userId, friendCount) => {
  const limit = getDailyPostLimit(friendCount);

  if (limit === 0) {
    return {
      allowed: false,
      message: "You need at least one friend to create a post.",
    };
  }

  if (limit === Infinity) {
    return { allowed: true, remaining: Infinity };
  }

  const since = new Date(Date.now() - DAY_MS);
  const count = await Post.countDocuments({
    userId,
    createdAt: { $gte: since },
  });

  if (count >= limit) {
    return {
      allowed: false,
      message: `Posting limit reached. You can post ${limit} time${limit > 1 ? "s" : ""} every 24 hours with your current friend count.`,
    };
  }

  return {
    allowed: true,
    remaining: limit - count,
  };
};

module.exports = {
  getDailyPostLimit,
  validatePostingLimit,
};
