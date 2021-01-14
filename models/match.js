const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema({
  player: {
    type: String,
    required: true,
  },
  teamName: {
    type: String,
    required: true,
    default: "WAITING TO BE FILLED IN",
  },
  teamNameOpp: {
    type: String,
    required: true,
    default: "WAITING TO BE FILLED IN",
  },
  gameDate: {
    type: Date,
    required: false,
    default: Date.now,
  },
  matchTime: {
    type: Number,
    required: true,
    default: 90,
  },
  gamePlace: {
    type: String,
    required: true,
    default: "Home",
  },
  isWin: {
    type: Boolean,
    required: true,
    default: true,
  },
  goals: {
    type: Number,
    required: true,
    default: 0,
  },
  goalsOpp: {
    type: Number,
    required: true,
    default: 0,
  },
  pens: {
    type: Number,
    required: true,
    default: 0,
  },
  pensOpp: {
    type: Number,
    required: true,
    default: 0,
  },
  shots: {
    type: Number,
    required: true,
    default: 0,
  },
  shotsOpp: {
    type: Number,
    required: true,
    default: 0,
  },
  targetShots: {
    type: Number,
    required: true,
    default: 0,
  },
  targetShotsOpp: {
    type: Number,
    required: true,
    default: 0,
  },
  possession: {
    type: Number,
    required: true,
    default: 0,
  },
  possessionOpp: {
    type: Number,
    required: true,
    default: 0,
  },
  tackles: {
    type: Number,
    required: true,
    default: 0,
  },
  tacklesOpp: {
    type: Number,
    required: true,
    default: 0,
  },
  fouls: {
    type: Number,
    required: true,
    default: 0,
  },
  foulsOpp: {
    type: Number,
    required: true,
    default: 0,
  },
  corners: {
    type: Number,
    required: true,
    default: 0,
  },
  cornersOpp: {
    type: Number,
    required: true,
    default: 0,
  },
  shotAcc: {
    type: Number,
    required: true,
    default: 0,
  },
  shotAccOpp: {
    type: Number,
    required: true,
    default: 0,
  },
  passAcc: {
    type: Number,
    required: true,
    default: 0,
  },
  passAccOpp: {
    type: Number,
    required: true,
    default: 0,
  },
  goalShotRatio: {
    type: Number,
    required: true,
    default: 0,
  },
  goalShotRatioOpp: {
    type: Number,
    required: true,
    default: 0,
  },
  WLNumber: {
    type: Number,
    required: false,
    default: 0,
  },
  startTime: {
    type: Date,
    required: false,
    default: Date.now,
  },
  endTime: {
    type: Date,
    required: false,
    default: Date.now,
  },
  dayPart: {
    type: String,
    required: false,
    default: "",
  },
  restPeriod: {
    type: Number,
    required: false,
    default: 0,
  },
  gameNumberWL: {
    type: Number,
    required: false,
    default: 0,
  },
  gameNumberTotal: {
    type: Number,
    required: false,
    default: 0,
  },
  gameSeq: {
    type: Number,
    required: false,
    default: 0,
  },
  loseStreak: {
    type: Number,
    required: false,
    default: 0,
  },
  winStreak: {
    type: Number,
    required: false,
    default: 0,
  },
  maxRest: {
    type: Number,
    required: false,
    default: 0,
  },
  restSeq: {
    type: Number,
    required: false,
    default: 0,
  },
  winCounterWL: {
    type: Number,
    required: false,
    default: 0,
  },
  WLWins: {
    type: Number,
    required: false,
    default: 0,
  },
  WLScore: {
    type: String,
    required: false,
    default: "",
  },

  // heatmap: [
  //   {
  //     player: { type: String, required: false },
  //     img: { type: String, required: false },
  //   },
  // ],
  // button: [
  //   {
  //     action: { type: String, required: false },
  //     time: { type: Date, required: false, default: new Date() },
  //   },
  // ],
});

module.exports = mongoose.model("Match", matchSchema);
