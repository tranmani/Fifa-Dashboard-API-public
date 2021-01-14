const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
  },
  sender: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  time: { type: Date, required: true, default: Date.now },
  messages: [
    {
      message: { type: String, required: true },
      time: { type: Date, required: true, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("Message", messageSchema);
