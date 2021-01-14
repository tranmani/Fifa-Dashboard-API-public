const { gql } = require("apollo-server-express");

module.exports = gql`
  scalar Date

  type User {
    id: String
    email: String
    role: String
    firstname: String
    lastname: String
    token: String
    link: String
    coach: String
    code: String
    organization: String
    position: String
    club: String
    verified: Boolean
    players: [String]
    winlose: [WinLose]
    picture: String
    channels: [UserChatId]
    chats: [UserChatId]
  }

  type WinLose {
    wins: Int
    loses: Int
    date: Date
  }

  type UserChatId {
    id: String!
    unread: Int!
  }

  type File {
    signedUrl: String!
    fileName: String!
  }
`;
