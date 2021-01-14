const { PubSub } = require("apollo-server");
const pubsub = new PubSub();
const { verifyToken } = require("../utils/auth");
const User = require("../models/user");
const Club = require("../models/club");

module.exports = {
  Query: {
    // Get all players or filter player based on name and club
    async getPlayers(root, args, context) {
      const { token } = context;
      const _ = verifyToken(token);
      const { query, club } = args;

      try {
        // Regex for MongoDB
        const regex = new RegExp(`${query}`, "i");
        let users;
        const names = query.split(" ");

        if (!club) {
          users = await User.find({ $or: [{ firstname: regex }, { lastname: regex }], role: "eSporter" }).sort({ firstname: 1 });
        } else {
          users = await User.find({ $or: [{ firstname: regex }, { lastname: regex }], role: "eSporter", club: club }).sort({ firstname: 1 });
        }

        if (names.length == 2) {
          const regexFirstname = new RegExp(`${query.split(" ")[0]}`, "i");
          const regexLastname = new RegExp(`${query.split(" ")[1]}`, "i");

          if (!club)
            users = [
              ...(await User.find({ $and: [{ firstname: regexFirstname }, { lastname: regexLastname }], role: "eSporter" }).sort({ firstname: 1 })),
            ];
          else
            users = [
              ...(await User.find({ $and: [{ firstname: regexFirstname }, { lastname: regexLastname }], role: "eSporter", club: club }).sort({
                firstname: 1,
              })),
            ];
        }

        if (!users) throw new Error("No user name matched");

        return users;
      } catch (e) {
        throw new Error(e);
      }
    },

    // Get one club by name
    async getClub(root, args, context) {
      const { token } = context;
      const _ = verifyToken(token);
      const { name } = args;

      try {
        const club = await Club.findOne({ name });
        if (!club) throw new Error("Club does not exist");

        return club;
      } catch (e) {
        throw new Error(e);
      }
    },

    // Get all clubs and players in that club
    async getClubs(root, args, context) {
      const { token } = context;
      const _ = verifyToken(token);
      const { query } = args;

      try {
        const regex = new RegExp(`${query}`, "i");

        const clubs = await Club.find({ name: regex }).sort({ name: 1 });
        if (!clubs) throw new Error("Club does not exist");

        let returnClubs = JSON.parse(JSON.stringify(clubs));

        for (let i = 0; i < clubs.length; i++) {
          returnClubs[i].id = clubs[i].id;
          returnClubs[i].players = [];
          const users = await User.find({ email: { $in: clubs[i].players.map((player) => player) } });
          for (let j = 0; j < clubs[i].players.length; j++) {
            returnClubs[i].players = [...users];
          }
        }

        return returnClubs;
      } catch (e) {
        throw new Error(e);
      }
    },

    // Get player by email
    async getPlayerByEmail(parent, args, context) {
      const { token } = context;
      const _ = verifyToken(token);
      const { email } = args;

      try {
        const user = await User.findOne({ email, role: "eSporter" });
        if (!user) throw new Error("Player does not exist");

        return user;
      } catch (e) {
        throw new Error(e);
      }
    },

    // Get all user based on role
    async getAllUserByRole(root, args, context) {
      const { token } = context;
      const _ = verifyToken(token);

      const { role } = args;
      if (role != "eSporter" && role != "Coach" && role != "Researcher") throw new Error("No role: " + role);

      try {
        let users = await User.find({ role: role }).sort({ firstname: 1 });

        if (!users) throw new Error("No users are " + role);

        return users;
      } catch (e) {
        throw new Error(e);
      }
    },
  },
  Mutation: {},
  Subscription: {},
};
