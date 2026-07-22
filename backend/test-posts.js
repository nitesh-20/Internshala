const mongoose = require('mongoose');
const Post = require('./Model/Post');
require('dotenv').config();

mongoose.connect(process.env.DATABASE_URL).then(async () => {
  const posts = await Post.find({}).sort({ createdAt: -1 }).limit(5);
  console.log('Posts count:', posts.length);
  posts.forEach(p => {
    console.log(`ID: ${p._id}, Caption: ${p.caption}, Media:`, p.media);
  });
  process.exit(0);
});
