const mongoose = require("mongoose");

const defaultPicture = "https://fifadashboard.s3.amazonaws.com/profile/fifa-21-logo.png";

const clubSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  coachEmail: {
    type: String,
    required: true,
  },
  coachFirstname: {
    type: String,
    required: true,
  },
  coachLastname: {
    type: String,
    required: true,
  },
  players: {
    type: Array,
    required: true,
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
});

module.exports = mongoose.model("club", clubSchema);
