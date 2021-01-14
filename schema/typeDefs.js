const { gql } = require("apollo-server-express");

module.exports = gql`
  scalar Date

  type Query {
    # Sign in/Sign up
    login(email: String!, password: String!): User!
    getUserByToken(token: String!): User!
    useSignupCode(code: String!): User

    # Filter
    getPlayerByEmail(email: String!): User!
    getPlayers(query: String!, club: String): [User!]
    getClub(name: String!): Club!
    getClubs(query: String!): [Club!]
    getAllUserByRole(role: String!): [User!]

    # Community
    getChannelDetail(id: String!): Channel!
    getChannelNameById(idList: [String]!): [Channel]!
    getChatsById(idList: [String]!): [Chat]!
    getAllMessageByChatId(id: String!): [Message]!

    # Match
    getMatchesByUser(email: String): [Match]!
    getMatchesByClub(player: String!, team: String): [Match]!
    getAllMatch: [Match]!

    # Setting
    getSignedUrl(fileName: String!, fileType: String!): File!
  }

  type Mutation {
    # Sign in/Sign up
    createUser(
      email: String!
      password: String!
      confirm: String!
      firstname: String!
      lastname: String!
      role: String!
      club: String
      coach: String
      coachEmail: String
      organization: String
      position: String
      code: String
    ): User!
    verifyToken(token: String!): User!

    # Match
    createMatch(teamName: String, teamNameOpp: String): Match!
    addMatch(player: String, teamNameOpp: String!, matchDetail: MatchDetailInput!): Match

    # Community individual chat
    createChat(user1: String!, user2: String!): Chat!
    deleteChat(id: String!, user: String!): String

    # Community channel
    createChannel(channelName: String!, users: [String]!): Channel!
    addMembersToChannel(id: String!, users: [String]!): Channel
    removeMemberFromChannel(id: String!, user: String!): Channel!
    leaveChannel(id: String!, user: String!): String

    # Community message
    createMessage(id: String!, message: String!, isChannel: Boolean!): Message!

    # Setting
    updateProfile(
      oldPassword: String
      newPassword: String
      firstname: String!
      lastname: String!
      picture: String!
      clubPicture: String
      clubName: String
    ): String
  }

  type Subscription {
    newChat(user: String!): Chat
    deleteChat(id: String!): String
    newChannel(user: String!): Channel
    deleteChannel(id: String!): Channel
    newMessage(id: String!): Message
  }
`;
