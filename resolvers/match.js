const { PubSub } = require("apollo-server");
const { verifyToken } = require("../utils/auth");
const User = require("../models/user");
const Match = require("../models/match");

module.exports = {
  Query: {
    async getMatchesByUser(parent, args, context) {
      const { token } = context;
      const _ = verifyToken(token);

      const { email } = args;

      return await Match.find({ player: email || _.email });
    },
    async getMatchesByClub(parent, args, context) {
      const { token } = context;
      const _ = verifyToken(token);

      const { player, team } = args;
      const regex = new RegExp(`${team}`, "i");

      const user = await User.findOne({ email: _.email });
      if (!user) throw new Error("User email does not exist!");

      const playerInfo = await User.findOne({ email: player });
      if (!playerInfo) throw new Error("Player email does not exist!");

      let matches = await Match.aggregate([
        { $match: { player: player, $or: [{ teamName: regex }, { teamNameOpp: regex }] } },
        {
          $lookup: {
            from: "clubs",
            localField: "teamName",
            foreignField: "name",
            as: "teamInfo",
          },
        },
        {
          $lookup: {
            from: "clubs",
            localField: "teamNameOpp",
            foreignField: "name",
            as: "teamInfoOpp",
          },
        },
      ]);

      if (user.role == "Coach" || user.role == "eSporter") {
        const sameClub = matches.some((match) => match.teamName == user.club);
        console.log(sameClub);
        if (!sameClub) return [];
      }

      return matches;
    },
    async getAllMatch(parent, args, context) {
      const { token } = context;
      const _ = verifyToken(token);

      return await Match.find();
    },
  },

  Mutation: {
    async createMatch(parent, args, context) {
      const { token } = context;
      const _ = verifyToken(token);

      const { teamName, teamNameOpp } = args;

      const user = await User.findOne({ email: _.email });
      if (!user) throw new Error("Email does not exist!");

      let match = new Match({ player: email, teamName, teamNameOpp }, (err) => {
        if (err) throw err;
      });

      match.save(function (err, res) {
        match = res;
      });

      return match;
    },
    async addMatch(parent, args, context) {
      // const { token } = context;
      // const _ = verifyToken(token);

      const { player, teamNameOpp, matchDetail } = args;

      const {
        matchTime,
        gameDate,
        gamePlace,
        goals,
        goalsOpp,
        pens,
        pensOpp,
        shots,
        shotsOpp,
        targetShots,
        targetShotsOpp,
        possession,
        possessionOpp,
        tackles,
        tacklesOpp,
        fouls,
        foulsOpp,
        corners,
        cornersOpp,
        shotAcc,
        shotAccOpp,
        passAcc,
        passAccOpp,
        WLNumber,
        startTime,
        endTime,
        restPeriod,
        gameNumberWL,
        gameNumberTotal,
        gameSeq,
        loseStreak,
        winStreak,
        maxRest,
        restSeq,
        winCounterWL,
        WLWins,
        WLScore,
      } = matchDetail;

      const user = await User.findOne({ email: player || _.email });
      if (!user) throw new Error("Email does not exist");
      // if (user.role != "eSporter") throw new Error("Only eSporter are able to register a new match!");

      // const gameDate = new Date(startTime);

      let isWin;
      if (goals > goalsOpp) isWin = true;
      else if (goals == goalsOpp) {
        if (pens >= pensOpp) isWin = true;
        else isWin = false;
      } else isWin = false;

      // Calculate goal shot ratio
      const goalShotRatio = (goals, shots) => {
        if (goals == 0 && shots == 0) return 0;
        else {
          let ratio = goals / shots;
          if (ratio == 0) return 0;
          else return ratio.toFixed(5);
        }
      };

      // Calculate opponent goal shot ratio
      const goalShotRatioOpp = (goalsOpp, shotsOpp) => {
        if (goalsOpp == 0 && shotsOpp == 0) return 0;
        else {
          let ratio = goalsOpp / shotsOpp;
          if (ratio == 0) return 0;
          else return ratio.toFixed(5);
        }
      };

      // Calcalate day part based on match added time
      const now = Date.now();
      let dayPart = "";
      const date = new Date(now);
      const hour = date.getHours();

      if (hour >= 6 && hour <= 12) dayPart = "Morning";
      else if (hour > 12 && hour <= 17) daypart = "Afternoon";
      else if (hour > 17 && hour <= 22) daypart = "Evening";
      else if (hour > 22 && hour < 6) daypart = "Night";

      // Add match data to the database
      let match = new Match(
        {
          player: player || _.email,
          teamName: user.club,
          teamNameOpp,
          gameDate,
          matchTime,
          gamePlace,
          isWin,
          goals,
          goalsOpp,
          pens,
          pensOpp,
          shots,
          shotsOpp,
          targetShots,
          targetShotsOpp,
          possession,
          possessionOpp,
          tackles,
          tacklesOpp,
          fouls,
          foulsOpp,
          corners,
          cornersOpp,
          shotAcc,
          shotAccOpp,
          passAcc,
          passAccOpp,
          goalShotRatio: goalShotRatio(goals, shots),
          goalShotRatioOpp: goalShotRatioOpp(goalsOpp, shotsOpp),
          WLNumber,
          startTime,
          endTime,
          dayPart,
          restPeriod,
          gameNumberWL,
          gameNumberTotal,
          gameSeq,
          loseStreak,
          winStreak,
          maxRest,
          restSeq,
          winCounterWL,
          WLWins,
          WLScore,
        },
        (err) => {
          if (err) throw err;
        }
      );

      match.save(function (err, res) {
        match = res;
        if (err) throw new Error(err);
      });

      const today = new Date();
      const todayDate = today.getDate() + "-" + (today.getMonth() + 1) + "-" + today.getFullYear();

      const latestWinLose = user.winlose[user.winlose.length - 1];
      const latestWinLoseDate = latestWinLose.date.getDate() + "-" + (latestWinLose.date.getMonth() + 1) + "-" + latestWinLose.date.getFullYear();

      // Compare if the latest score is today, if yes then update today score
      if (todayDate == latestWinLoseDate) {
        if (isWin) {
          User.updateOne(
            { email: player || _.email, "winlose.date": latestWinLose.date },
            { $set: { "winlose.$.wins": latestWinLose.wins + 1, "winlose.$.date": today } },
            (err) => {
              if (err) throw err;
            }
          );
          latestWinLose.wins = latestWinLose.wins + 1;
        } else {
          User.updateOne(
            { email: player || _.email, "winlose.date": latestWinLose.date },
            { $set: { "winlose.$.loses": latestWinLose.loses + 1, "winlose.$.date": today } },
            (err) => {
              if (err) throw err;
            }
          );
          latestWinLose.loses = latestWinLose.loses + 1;
        }
        // Else put a new object in winlose array
      } else {
        if (isWin) {
          User.updateOne(
            { email: player || _.email },
            { $push: { winlose: [{ wins: latestWinLose.wins + 1, loses: latestWinLose.loses }] } },
            (err) => {
              if (err) throw err;
            }
          );
          user.winlose.push({ wins: latestWinLose.wins + 1, loses: latestWinLose.loses, date: today });
        } else {
          User.updateOne(
            { email: player || _.email },
            { $push: { winlose: [{ loses: latestWinLose.loses + 1, wins: latestWinLose.wins }] } },
            (err) => {
              if (err) throw err;
            }
          );
          user.winlose.push({ wins: latestWinLose.wins, loses: latestWinLose.loses + 1, date: today });
        }
      }

      return match;
    },
  },
  Subscription: {},
};
