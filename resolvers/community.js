const { PubSub, withFilter } = require("apollo-server");
const pubsub = new PubSub();
const { verifyToken } = require("../utils/auth");
const User = require("../models/user");
const Chat = require("../models/chat");
const Channel = require("../models/channel");
const Message = require("../models/message");
const mongoose = require("mongoose");

const CHAT_ADDED = "CHAT_ADDED";
const CHAT_DELETED = "CHAT_DELETED";
const CHANNEL_ADDED = "CHANNEL_ADDED";
const CHANNEL_DELETED = "CHANNEL_DELETED";
const MESSAGE_ADDED = "MESSAGE_ADDED";

module.exports = {
  Query: {
    // Return all message from chat id
    async getAllMessageByChatId(parent, args, context) {
      const { token } = context;
      const _ = verifyToken(token);

      const { id } = args;

      return await Message.find({ chatId: id });
    },
    // Return channel by id list provided
    async getChannelNameById(parent, args, context) {
      const { token } = context;
      const _ = verifyToken(token);

      const { idList } = args;

      // List of all channels
      let channels = await Channel.find({ _id: { $in: idList } });

      if (channels.length == 0) return channels;

      return channels;
    },
    // Return channel by id list provided
    async getChannelDetail(parent, args, context) {
      const { token } = context;
      const _ = verifyToken(token);

      const { id } = args;

      let channel = await Channel.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(id) } },
        {
          $lookup: {
            from: "users",
            localField: "owner.email",
            foreignField: "email",
            as: "owner",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "users.email",
            foreignField: "email",
            as: "users",
          },
        },
      ]);

      channel = channel[0];
      channel.id = id;
      channel.owner = channel.owner[0];
      channel.owner.displayName = channel.owner.firstname + " " + channel.owner.lastname;

      for (let i = 0; i < channel.users.length; i++) {
        channel.users[i].displayName = channel.users[i].firstname + " " + channel.users[i].lastname;
      }

      return channel;
    },
    // Return chat by id list provided
    async getChatsById(parent, args, context) {
      const { token } = context;
      const _ = verifyToken(token);

      const { idList } = args;

      let chats = await Chat.find({ _id: { $in: idList } });

      for (let i = 0; i < chats.length; i++) {
        const user1 = await User.findOne({ email: chats[i].user1.email });
        chats[i].user1.picture = user1.picture;

        const user2 = await User.findOne({ email: chats[i].user2.email });
        chats[i].user2.picture = user2.picture;
      }
      return chats;
    },
  },

  Mutation: {
    // Create a new chat and return id of the chat
    async createChat(parent, args, context) {
      const { token } = context;
      const _ = verifyToken(token);

      let { user1, user2 } = args;

      // Validate user email
      const userInfo1 = await User.findOne({ email: user1 });
      if (!userInfo1) throw new Error("User 1 is not existed!");
      const userInfo2 = await User.findOne({ email: user2 });
      if (!userInfo2) throw new Error("User 2 is not existed!");

      // Validate if there is already a chat between the two user
      userInfo1.chats.forEach((chat) => {
        const existed = userInfo2.chats.find((e) => e == chat);
        if (existed) throw new Error("Duplicate chat between two user");
      });

      user1 = {
        email: userInfo1.email,
        displayName: userInfo1.firstname + " " + userInfo1.lastname,
      };
      user2 = {
        email: userInfo2.email,
        displayName: userInfo2.firstname + " " + userInfo2.lastname,
      };

      let chat = new Chat(
        {
          user1,
          user2,
        },
        (err) => {
          if (err) throw err;
        }
      );

      // Save all data to chat variable and push it to MongoDB
      chat.save(function (err, res) {
        chat = res;
      });

      // Add chat id in both user database records
      await User.updateMany(
        { $or: [{ email: user1.email }, { email: user2.email }] },
        {
          $push: {
            chats: { id: chat.id, unread: 0 },
          },
        }
      );

      chat.user1.picture = userInfo1.picture;
      chat.user2.picture = userInfo2.picture;

      // Notify there is a new Chat
      pubsub.publish(CHAT_ADDED, { user: user1.email, newChat: chat });
      pubsub.publish(CHAT_ADDED, { user: user2.email, newChat: chat });

      return chat;
    },
    // Create a new chat and return id of the chat
    async deleteChat(parent, args, context) {
      const { token } = context;
      const _ = verifyToken(token);

      let { id, user } = args;

      // Validate user email
      const userInfo = await User.findOne({ email: user });
      if (!userInfo) throw new Error("User is not existed!");

      const chatInfo = await Chat.findById(id);
      // Validate if Chat id is valid
      if (!chatInfo) throw new Error("Chat is not existed!");
      // Validate if user is in the chat or not
      if (chatInfo.user1.email != user && chatInfo.user2.email != user) throw new Error("User is not in the chat!");

      let deleteFeedback;
      await Chat.findByIdAndDelete(id, function (err) {
        if (err) throw new Error("Error when deleting Chat from Database!");
        else deleteFeedback = "Done";
      });

      // Delete chat id in both user database records
      await User.updateMany(
        { email: [chatInfo.user1.email, chatInfo.user2.email] },
        {
          $pull: {
            chats: { id },
          },
        }
      );
      await Message.deleteMany({ chatId: id });

      // Notify the chat is deleted
      pubsub.publish(CHAT_DELETED, { user: chatInfo.user1.email, deleteChat: deleteFeedback });
      pubsub.publish(CHAT_DELETED, { user: chatInfo.user2.email, deleteChat: deleteFeedback });

      return deleteFeedback;
    },
    // Create a new channel and return id of the channel
    async createChannel(parent, args, context) {
      const { token } = context;
      const _ = verifyToken(token);

      let { channelName, users } = args;

      const ownerInfo = await User.findOne({ email: _.email });
      // Validate if owner is valid
      if (!ownerInfo) throw new Error("Owner email is not existed!");

      // Loop through users array
      let channelUsers = [];
      for (i = 0; i < users.length; i++) {
        const userInfo = await User.findOne({ email: users[i] });
        // Validate if user is valid
        if (!userInfo) throw new Error(`User <${users[i]}> is not existed!`);

        // Put all users email to channelUsers array
        channelUsers.push({
          email: userInfo.email,
          displayName: userInfo.firstname + " " + userInfo.lastname,
        });
      }

      let owner = {
        email: ownerInfo.email,
        displayName: ownerInfo.firstname + " " + ownerInfo.lastname,
      };

      // Save all data to channel variable and push it to MongoDB
      let channel = new Channel(
        {
          channelName,
          owner,
          users: channelUsers,
        },
        (err) => {
          if (err) throw err;
        }
      );

      channel.save(function (err, res) {
        channel = res;
      });

      // Push owner info to channelUsers so the channel id will be saved to owner account too
      channelUsers.push(owner);

      const userEmails = channelUsers.map((user) => user.email);

      // Add channel id to all members
      await User.updateMany(
        { email: userEmails },
        {
          $push: {
            channels: { id: channel.id, unread: 0 },
          },
        }
      );

      // Notify there is a new Channel
      userEmails.forEach((email) => {
        pubsub.publish(CHANNEL_ADDED, { email, newChannel: channel });
      });

      return channel;
    },
    // Add members to a channel
    async addMembersToChannel(parent, args, context) {
      const { token } = context;
      const _ = verifyToken(token);

      let { id, users } = args;

      let channelInfo = await Channel.findById(id);
      // Validate if Channel id is valid
      if (!channelInfo) throw new Error("Channel id doesn't not exist!");
      // Validate if sender is a member of the channel or not
      if (!channelInfo.owner.email == _.email) throw new Error("You are not the owner of this channel!");

      const ownerInfo = await User.findOne({ email: _.email });
      // Validate if owner is valid
      if (!ownerInfo) throw new Error("Owner email is not existed!");

      // Loop through users array
      let channelUsers = [];
      for (i = 0; i < users.length; i++) {
        const userInfo = await User.findOne({ email: users[i] });
        // Validate if user is valid
        if (!userInfo) throw new Error(`User <${users[i]}> is not existed!`);
        const existed = channelInfo.users.find((e) => e.email == users[i]);
        if (existed) throw new Error(`User <${users[i]}> is already a member of this channel!`);

        // Put all users email to channelUsers array
        channelUsers.push({
          email: userInfo.email,
          displayName: userInfo.firstname + " " + userInfo.lastname,
        });
      }

      // Add new users to channel users list
      channelInfo = await Channel.findByIdAndUpdate(
        { _id: id },
        {
          $push: {
            users: channelUsers,
          },
        },
        { new: true }
      );

      const userEmails = channelUsers.map((user) => user.email);

      // Add channel id to newly added members
      await User.updateMany(
        { email: userEmails },
        {
          $push: {
            channels: { id, unread: 0 },
          },
        }
      );

      userEmails.forEach((email) => {
        pubsub.publish(CHANNEL_ADDED, { email, channel: channelInfo });
      });

      return channelInfo;
    },
    // Remove members from a channel
    async removeMemberFromChannel(parent, args, context) {
      const { token } = context;
      const _ = verifyToken(token);

      let { id, user } = args;

      const channelInfo = await Channel.findById(id);
      // Validate if Channel id is valid
      if (!channelInfo) throw new Error("Channel id is not existed!");
      // Validate if the owner is using this route
      if (channelInfo.owner.email != _.email) throw new Error("You are not the owner of this channel!");

      // Validate if owner is valid
      const ownerInfo = await User.findOne({ email: _.email });
      if (!ownerInfo) throw new Error("Owner email is not existed!");

      // Validate if user is valid and is a member of that channel
      const userInfo = await User.findOne({ email: user });
      if (!userInfo) throw new Error(`User <${user}> is not existed!`);
      const existed = channelInfo.users.find((e) => e.email == user);
      if (!existed) throw new Error(`User <${user}> is not a member of this channel!`);

      // Remove user from channel
      let newChannelInfo = await Channel.findByIdAndUpdate(
        id,
        {
          $pull: {
            users: {
              email: user,
            },
          },
        },
        { new: true }
      );

      // Remove channel id from the deleted user
      await User.updateOne(
        { email: user },
        {
          $pull: {
            channels: { id },
          },
        }
      );

      pubsub.publish(CHANNEL_DELETED, { email: user, channel: newChannelInfo });

      return newChannelInfo;
    },
    // Leave a channel
    async leaveChannel(parent, args, context) {
      const { token } = context;
      const _ = verifyToken(token);

      let { id, user } = args;

      let channelInfo = await Channel.findById(id);
      // Validate if Channel id is valid
      if (!channelInfo) throw new Error("Channel id is not existed!");

      // Validate if user is valid and is a member of that channel
      const userInfo = await User.findOne({ email: user });
      if (!userInfo) throw new Error(`User <${user}> is not existed!`);
      const existed = channelInfo.users.find((e) => e.email == user);
      if (!existed && channelInfo.owner.email != user) throw new Error(`User <${user}> is not a member of this channel!`);

      // If user variable is the owner of this channel
      if (channelInfo.owner.email == user) {
        // Delete the channel if there are no members left
        if (channelInfo.users.length == 0) {
          await Channel.findByIdAndDelete(id);
          await Message.deleteMany({ chatId: id });
        } else {
          // Else change the owner from the oldest member
          await Channel.findByIdAndUpdate(id, {
            $set: {
              owner: channelInfo.users[0],
            },
          });
          // Remove new owner from the users list
          channelInfo = await Channel.findByIdAndUpdate(id, {
            $pull: {
              users: {
                email: channelInfo.users[0].email,
              },
            },
          });
        }
      } else {
        // Remove user from channel
        channelInfo = await Channel.findByIdAndUpdate(id, {
          $pull: {
            users: {
              email: user,
            },
          },
        });
      }

      // Remove channel id from the leaving user
      await User.updateOne(
        { email: user },
        {
          $pull: {
            channels: { id },
          },
        }
      );

      pubsub.publish(CHANNEL_DELETED, { email: user, channel: channelInfo });

      return "Done";
    },
    // Create a new message and return id of the channel
    async createMessage(parent, args, context) {
      const { token } = context;
      const _ = verifyToken(token);

      let { id, message, isChannel } = args;

      const senderInfo = await User.findOne({ email: _.email });
      // Validate if sender is valid
      if (!senderInfo) throw new Error("Sender email is not existed!");

      let chatInfo = {};

      if (isChannel) {
        chatInfo = await Channel.findById(id);
        // Validate if Channel id is valid
        if (!chatInfo) throw new Error("Channel id is not existed!");
        // Validate if sender is a member of the channel or not
        const isMember = chatInfo.users.find((e) => e.email == _.email);
        if (!isMember && chatInfo.owner.email != _.email) throw new Error("Sender is not a member of this channel!");

        // Add unread message number to all channel user
        let allUserEmail = chatInfo.users.map((e) => e.email);
        allUserEmail.push(chatInfo.owner.email);
        const allUserEmailExceptSender = allUserEmail.filter((e) => e != _.email);

        await User.updateMany(
          { email: allUserEmailExceptSender, "channels.id": id },
          {
            $inc: {
              "channels.$.unread": 1,
            },
          }
        );
      } else {
        chatInfo = await Chat.findById(id);
        // Validate if Chat id is valid
        if (!chatInfo) throw new Error("Chat id is not existed!");
        // Validate if sender is in the chat or not
        if (chatInfo.user1.email != _.email && chatInfo.user2.email != _.email) throw new Error("Sender is not in the chat!");

        // Find the other user who is not the sender
        const otherUser = () => {
          if (chatInfo.user1.email != _.email) return chatInfo.user1.email;
          else return chatInfo.user2.email;
        };

        // Add unread message number to that other user
        await User.updateOne(
          { email: otherUser },
          {
            $inc: {
              "chats.unread": 1,
            },
          }
        );
      }

      const today = new Date().getDate() + "-" + new Date().getMonth() + "-" + new Date().getFullYear();

      const messagesInfo = await Message.find({ chatId: id });
      let isNewMessage = false;
      let newMessage;

      if (messagesInfo.length != 0) {
        let lastMessages, lastMessage, lastMessageDay;
        lastMessages = messagesInfo[messagesInfo.length - 1];
        lastMessage = lastMessages.messages[lastMessages.messages.length - 1];
        lastMessageDay = lastMessage.time.getDate() + "-" + lastMessage.time.getMonth() + "-" + lastMessage.time.getFullYear();

        // If sender and day is the same as the last message then add a new message to messages array of Message document in the Database
        if (lastMessages.sender == _.email && today == lastMessageDay) {
          newMessage = await Message.findByIdAndUpdate(
            {
              _id: lastMessages.id,
            },
            {
              $push: {
                messages: {
                  message,
                },
              },
            },
            { new: true }
          );
        } else isNewMessage = true;
      } else isNewMessage = true;
      if (isNewMessage) {
        // Else create a new Message document in the Database
        newMessage = new Message(
          {
            chatId: id,
            sender: _.email,
            displayName: senderInfo.firstname + " " + senderInfo.lastname,
            messages: { message: message.toString() },
          },
          (err) => {
            if (err) throw err;
          }
        );

        newMessage.save(function (err, res) {
          newMessage = res;
        });
      }

      // Notify there is a new Channel
      pubsub.publish(MESSAGE_ADDED, { id, newMessage: newMessage });

      return newMessage;
    },
  },

  Subscription: {
    newChat: {
      subscribe: () => pubsub.asyncIterator([CHAT_ADDED]),
    },
    deleteChat: {
      subscribe: () => pubsub.asyncIterator([CHAT_DELETED]),
    },
    newChannel: {
      subscribe: () => pubsub.asyncIterator([CHANNEL_ADDED]),
    },
    deleteChannel: {
      subscribe: () => pubsub.asyncIterator([CHANNEL_DELETED]),
    },
    newMessage: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(MESSAGE_ADDED),
        (payload, variables) => {
          return payload.id === variables.id;
        }
      ),
    },
  },
};
