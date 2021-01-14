const { gql } = require("apollo-server-express");

module.exports = gql`
  scalar Date

  type Match {
    _id: String
    player: String
    teamName: String
    teamNameOpp: String
    gameDate: Date
    matchTime: Int
    gamePlace: String
    isWin: Boolean
    goals: Int
    goalsOpp: Int
    pens: Int
    pensOpp: Int
    shots: Int
    shotsOpp: Int
    targetShots: Int
    targetShotsOpp: Int
    possession: Int
    possessionOpp: Int
    tackles: Int
    tacklesOpp: Int
    fouls: Int
    foulsOpp: Int
    corners: Int
    cornersOpp: Int
    shotAcc: Int
    shotAccOpp: Int
    passAcc: Int
    passAccOpp: Int
    goalShotRatio: Float
    goalShotRatioOpp: Float
    WLNumber: Int
    startTime: Date
    endTime: Date
    dayPart: String
    restPeriod: Int
    gameNumberWL: Int
    gameNumberTotal: Int
    gameSeq: Int
    loseStreak: Int
    winStreak: Int
    maxRest: Int
    restSeq: Int
    winCounterWL: Int
    WLWins: Int
    WLScore: String
    teamInfo: [Club]
    teamInfoOpp: [Club]

    # heatmap: [Heatmap]
    # button: [Button]
  }

  input MatchDetailInput {
    gameDate: Date
    matchTime: Int
    gamePlace: String
    goals: Int
    goalsOpp: Int
    pens: Int
    pensOpp: Int
    shots: Int
    shotsOpp: Int
    targetShots: Int
    targetShotsOpp: Int
    possession: Int
    possessionOpp: Int
    tackles: Int
    tacklesOpp: Int
    fouls: Int
    foulsOpp: Int
    corners: Int
    cornersOpp: Int
    shotAcc: Int
    shotAccOpp: Int
    passAcc: Int
    passAccOpp: Int
    WLNumber: Int
    startTime: Date
    endTime: Date
    restPeriod: Int
    gameNumberWL: Int
    gameNumberTotal: Int
    gameSeq: Int
    loseStreak: Int
    winStreak: Int
    maxRest: Int
    restSeq: Int
    winCounterWL: Int
    WLWins: Int
    WLScore: String
  }

  # type Heatmap {
  #   player: String!
  #   img: String!
  # }

  # type Button {
  #   action: String!
  #   time: Date!
  # }
`;
