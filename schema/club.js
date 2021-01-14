const { gql } = require("apollo-server-express");

module.exports = gql`
  type Club {
    id: String
    coachEmail: String!
    coachFirstname: String!
    coachLastname: String!
    name: String!
    players: [User]!
    picture: String
  }
`;
