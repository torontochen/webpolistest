const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  title: {
    type: String
    // required: true
  },
  imageName: {
    type: String,
    required: true
  },
  imageBase64: {
    type: String
  },
  categories: {
    type: [String]
    // required: true
  },
  description: {
    type: String
    // required: true
  },
  createdDate: {
    type: Date,
    default: Date.now
  },
  likes: {
    type: Number,
    default: 0
  },
  // property ('createdBy') === path
  // ref ('User') === model
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    // required: true,
    ref: "User"
  },
  messages: [
    {
      messageBody: {
        type: String,
        required: true
      },
      messageDate: {
        type: Date,
        default: Date.now
      },
      messageUser: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
      }
    }
  ]
});

// Create index to search on all fields of posts
PostSchema.index({
  "$**": "text"
});

module.exports = mongoose.model("Post", PostSchema);