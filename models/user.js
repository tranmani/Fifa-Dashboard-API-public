const mongoose = require("mongoose");

const defaultPicture = "https://fifadashboard.s3.amazonaws.com/profile/default-person.png";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
    min: 8,
    max: 32,
  },
  role: {
    type: String,
    required: true,
  },
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: false,
  },
  coach: {
    type: String,
    required: false,
  },
  organization: {
    type: String,
    required: false,
  },
  position: {
    type: String,
    required: false,
  },
  club: {
    type: String,
    required: false,
  },
  players: {
    type: [String],
    required: false,
  },
  code: {
    type: String,
    required: false,
  },
  winlose: [
    {
      wins: { type: Number, required: true, default: 0 },
      loses: { type: Number, required: true, default: 0 },
      date: { type: Date, required: true, default: Date.now },
    },
  ],
  verified: {
    type: Boolean,
    required: true,
    default: false,
  },
  picture: {
    type: String,
    required: true,
    default: defaultPicture,
  },
  dateCreated: {
    type: Date,
    required: true,
    default: Date.now,
  },
  channels: [
    {
      id: { type: String, required: true },
      unread: { type: Number, required: true },
    },
  ],
  chats: [
    {
      id: { type: String, required: true },
      unread: { type: Number, required: true },
    },
  ],
});

module.exports = mongoose.model("User", userSchema);
