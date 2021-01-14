const { PubSub } = require("apollo-server");
const { AuthenticationError } = require("apollo-server-express");
const nodemailer = require("nodemailer");
const { createToken, verifyToken } = require("../utils/auth");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const Club = require("../models/club");
const { GraphQLScalarType } = require("graphql");
const { Kind } = require("graphql/language");
const s3 = require("../s3");
const { v4: uuidv4 } = require("uuid");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ADMIN_GMAIL,
    pass: process.env.GMAIL_APP_PASS,
  },
});

module.exports = {
  Query: {
    // Login
    async login(root, args, context) {
      const { email, password } = args;

      const user = await User.findOne({ email });
      if (!user) throw new Error("Email does not exist");

      const passwordIsValid = bcrypt.compareSync(password, user.password);
      if (!passwordIsValid) throw new Error("Password incorrect");
      if (!user.verified) throw new Error("Your account is being verified by the administrator");

      return createToken(email, password);
    },
    // Get user detail by token
    async getUserByToken(root, args, context) {
      const { token } = args;

      try {
        const { email } = verifyToken(token);

        const user = await User.findOne({ email });
        if (!user) throw new Error("Email does not exist");

        return user;
      } catch (e) {
        throw new AuthenticationError("Authentication token is invalid, please log in");
      }
    },
    // Use sign up code from coach
    async useSignupCode(parent, args, context) {
      const code = args.code;
      const user = await User.findOne({ code });

      if (!user) {
        throw new Error("Code does not exist!");
      }

      return user;
    },
    // Return signed URL for front-end to use
    async getSignedUrl(root, args, context) {
      const { token } = context;
      const _ = verifyToken(token);

      const { fileName, fileType } = args;
      const newFileName = `${uuidv4()}-${fileName}`;

      const s3Params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: newFileName,
        Expires: 60 * 20,
        ContentType: fileType,
        ACL: "public-read",
      };

      const preSignedUrl = await new Promise((resolve, reject) => {
        s3.getSignedUrl("putObject", s3Params, function (err, url) {
          if (err) {
            reject(err);
          }
          resolve(url);
        });
      });

      const returnData = {
        signedUrl: preSignedUrl,
        fileName: `${process.env.AWS_S3_BASE_URL}/${newFileName}`,
      };

      return returnData;
    },
  },

  Mutation: {
    // Create new user based on role
    async createUser(root, args, context) {
      const { email, password, confirm, role, firstname, lastname, organization, position, coach, coachEmail, club } = args;

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        throw new Error("Email already exists!");
      }

      if (password !== confirm) {
        throw new Error("Passwords are inconsistent!");
      }

      if (!role) {
        throw new Error("User role is required!");
      }

      if (!firstname) {
        throw new Error("First name is required!");
      }

      if (!lastname) {
        throw new Error("Last name is required!");
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      let user;

      if (role == "Coach") {
        if (!club) throw new Error("Club name is required!");
        if (await Club.findOne({ name: club })) throw new Error("Club name existed!");

        const code = Math.random().toString(36).substring(2);
        const newClub = new Club(
          {
            coachEmail: email,
            coachFirstname: firstname,
            coachLastname: lastname,
            name: club,
            players: [],
          },
          (err) => {
            if (err) throw err;
          }
        );
        newClub.save();

        // Create new user
        user = new User(
          {
            email,
            password: hashedPassword,
            role,
            firstname,
            lastname,
            code,
            club,
          },
          (err) => {
            if (err) throw err;
          }
        );
      }

      if (role == "eSporter") {
        if (!coach) throw new Error("Coach name is required!");
        if (!coachEmail) throw new Error("Coach email is required!");
        if (!club) throw new Error("Club name is required!");
        const winlose = [{ wins: 0, loses: 0 }];

        // Create new user
        user = new User(
          {
            email,
            password: hashedPassword,
            role,
            firstname,
            lastname,
            coach,
            club,
            winlose,
          },
          (err) => {
            if (err) throw err;
          }
        );
      }

      if (role == "Researcher") {
        if (!organization) throw new Error("Organization name is required!");
        if (!position) throw new Error("Position is required!");

        // Create new user
        user = new User(
          {
            email,
            password: hashedPassword,
            role,
            firstname,
            lastname,
            organization,
            position,
          },
          (err) => {
            if (err) throw err;
          }
        );
      }

      // Save new user
      user.save();

      // Add eSporter to players array in Coach account
      // Add new player to a players list in Club schema
      if (role == "eSporter") {
        User.updateOne({ email: coachEmail }, { $push: { players: [email] } }, (err) => {
          if (err) throw err;
        });
        Club.updateOne({ name: club }, { $push: { players: [email] } }, (err) => {
          if (err) throw err;
        });

        // Notify coach for new player
        const sendToCoach = {
          from: "donal@trump.com",
          to: coachEmail,
          subject: "New Player added to your Team",
          html: `<h1>A player just used your code to register on FIFA Dashboard website</h1>
          <p>New Player info:
          <br/> <strong>Email</strong> : ${email}
          <br/> <strong>First Name</strong> : ${firstname}
          <br/> <strong>Last Name</strong> : ${lastname}`,
        };

        transporter.sendMail(sendToCoach, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent to user: " + info.response);
          }
        });
      }

      // Send email to newly created user
      const sendToUser = {
        from: "donal@trump.com",
        to: email,
        subject: "Account registration confirmation - FIFA Dashboard",
        html: `<h1>Welcome to FIFA Dashboard</h1><p>Thank you ${firstname} ${lastname}!</p>`,
      };

      // Notify admin for new user
      const sendToAdmin = {
        from: "donal@trump.com",
        to: process.env.ADMIN_GMAIL,
        subject: "New Account created - FIFA Dashboard",
        html: `<h1>New Account at FIFA Dashboard</h1>
        <p>New user info:
        <br/> <strong>Email</strong> : ${email}
        <br/> <strong>Role</strong> : ${role}
        <br/> <strong>First Name</strong> : ${firstname}
        <br/> <strong>Last Name</strong> : ${lastname}
        <br/> <strong>Organization</strong> : ${organization}
        <br/> <strong>Club</strong> : ${club}</p>`,
      };

      transporter.sendMail(sendToUser, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent to user: " + info.response);
        }
      });

      transporter.sendMail(sendToAdmin, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent to admin: " + info.response);
        }
      });

      return createToken(email, password);
    },

    async verifyToken(root, args, context) {
      const { token } = args;
      return verifyToken(token);
    },

    async updateProfile(root, args, context) {
      const { token } = context;
      const _ = verifyToken(token);

      const { oldPassword, newPassword, firstname, lastname, picture, clubPicture, clubName } = args;

      // Validate user email
      const user = await User.findOne({ email: _.email });
      if (!user) throw new Error("User does not existed!");

      // Check old password, if right then hash new password
      let hashedPassword;
      if (oldPassword && newPassword) {
        const passwordIsValid = bcrypt.compareSync(oldPassword, user.password);
        if (!passwordIsValid) return "Old password incorrect";

        hashedPassword = await bcrypt.hash(newPassword, 10);
      }

      // Update profile based on role
      if (user.role == "eSporter" || user.role == "Coach") {
        // Update user profile
        if (!hashedPassword) {
          await User.findOneAndUpdate(
            { email: _.email },
            {
              $set: {
                firstname,
                lastname,
                picture,
              },
            }
          );
        } else {
          await User.findOneAndUpdate(
            { email: _.email },
            {
              $set: {
                password: hashedPassword,
                firstname,
                lastname,
                picture,
              },
            }
          );
        }

        // Update club data
        if (user.role == "Coach") {
          // Update club data in clubs collection
          await Club.findOneAndUpdate(
            { coachEmail: _.email },
            {
              $set: {
                coachFirstname: firstname,
                coachLastName: lastname,
                picture: clubPicture,
                name: clubName,
              },
            }
          );
          // Update club data in users collection
          await User.updateMany(
            { club: user.club },
            {
              $set: {
                club: clubName,
              },
            }
          );
        }
      } else if (user.role == "Researcher") {
        // Update user profile
        if (!hashedPassword) {
          await User.findOneAndUpdate(
            { email: _.email },
            {
              $set: {
                firstname: firstname,
                lastname,
                picture,
              },
            }
          );
        } else {
          await User.findOneAndUpdate(
            { email: _.email },
            {
              $set: {
                password: hashedPassword,
                firstname,
                lastname,
                picture,
              },
            }
          );
        }
      }

      return "Done";
    },
  },

  Date: new GraphQLScalarType({
    name: "Date",
    description: "Date custom scalar type",
    parseValue(value) {
      return new Date(value); // value from the client
    },
    serialize(value) {
      return value.getTime(); // value sent to the client
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return new Date(+ast.value); // ast value is always in string format
      }
      return null;
    },
  }),
  Subscription: {},
};
