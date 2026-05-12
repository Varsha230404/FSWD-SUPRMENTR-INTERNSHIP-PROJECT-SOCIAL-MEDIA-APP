const mongoose = require('mongoose');

let lastError = null;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    lastError = null;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    lastError = error.message;
    console.error('\n[MongoDB] Connection failed:', error.message);
    if (/IP that isn'?t whitelisted|whitelist/i.test(error.message)) {
      console.error(
        '[MongoDB] Your current IP is not whitelisted in MongoDB Atlas.\n' +
        '          Fix: https://cloud.mongodb.com → Network Access → Add Current IP Address.\n' +
        '          Or for development, allow all with 0.0.0.0/0.\n'
      );
    }
    console.error('[MongoDB] The server will keep running so the frontend can show a clear error.\n');
    setTimeout(connectDB, 30000);
  }
};

connectDB.isReady = () => mongoose.connection.readyState === 1;
connectDB.lastError = () => lastError;

module.exports = connectDB;
