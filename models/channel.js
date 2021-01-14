const mongoose = require("mongoose");

const channelSchema = new mongoose.Schema({
  channelName: {
    type: String,
    required: true,
  },
  owner: {
    email: { type: String, required: true },
    displayName: { type: String, required: true },
  },
  users: [
    {
      email: { type: String, required: true },
      displayName: { type: String, required: true },
      joinedDate: { type: Date, required: true, default: new Date() },
    },
  ],
  dateCreated: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

module.exports = mongoose.model("Channel", channelSchema);
