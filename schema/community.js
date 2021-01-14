const { gql } = require("apollo-server-express");

module.exports = gql`
  scalar Date

  type Chat {
    id: String!
    user1: ChatUser!
    user2: ChatUser!
    dateCreated: String!
    messages: [Message]!
  }

  type Channel {
    id: String
    channelName: String!
    owner: ChannelOwner!
    users: [ChannelUser]!
    usersInfo: [ChannelUser]
    dateCreated: Date!
    messages: [Message]
  }

  type ChannelUser {
    email: String
    displayName: String
    joinedDate: Date
    picture: String
  }

  type ChatUser {
    email: String!
    displayName: String!
    picture: String
  }

  type ChannelOwner {
    email: String
    displayName: String
    picture: String
  }

  type Message {
    id: String
    sender: String
    displayName: String
    messages: [MessageBody]
    time: Date
  }

  type MessageBody {
    id: String
    message: String
    time: Date
  }
`;
