require("dotenv").config();
const AWS = require("aws-sdk");

const s3 = {
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET,
  },
  region: process.env.AWS_S3_REGION,
  params: {
    ACL: "public-read",
    Bucket: process.env.AWS_S3_BUCKET,
  },
};

module.exports = new AWS.S3(s3);
