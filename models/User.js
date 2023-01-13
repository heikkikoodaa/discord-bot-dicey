const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
  guildID: {
    type: String,
    required: true,
  },
  userID: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  exp: {
    type: Number,
    default: 0,
  },
  level: {
    type: Number,
    default: 1,
  },
});

module.exports = mongoose.model('Users', UserSchema);
