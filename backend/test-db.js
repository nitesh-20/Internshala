const mongoose = require('mongoose');
const LoginActivity = require('./Model/LoginActivity');
require('dotenv').config();

mongoose.connect(process.env.DATABASE_URL).then(async () => {
  const docs = await LoginActivity.find({});
  console.log('Docs count:', docs.length);
  console.log(docs);
  process.exit(0);
});
