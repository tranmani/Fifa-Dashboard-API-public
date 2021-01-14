const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  user1: {
    email: { type: String, required: true },
    displayName: { type: String, required: true },
  },

  user2: {
    email: { type: String, required: true },
    displayName: { type: String, required: true },
  },

  dateCreated: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

module.exports = mongoose.model("Chat", chatSchema);
