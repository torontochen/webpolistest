const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const path = require("path");
// const apolloServerExpress = require("apollo-server-express");

const fs = require("fs");
// const streamifier = require("streamifier");

// const DOWNBROWSER_DIR = "./client/public/download";
const DOWN_DIR = "./download";
mongoose.set("useFindAndModify", false);
// const fs = require("fs");
// var btoa = require("btoa");

const conn = mongoose.connection;
// const Grid = require("gridfs-stream");
// const crypto = require("crypto");

const createToken = (user, secret, expiresIn) => {
  const {
    username,
    email
  } = user;
  return jwt.sign({
    username,
    email
  }, secret, {
    expiresIn
  });
};

module.exports = {
  Query: {
    getCurrentUser: async (_, args, {
      User,
      currentUser
    }) => {
      if (!currentUser) {
        return null;
      }
      const user = await User.findOne({
        username: currentUser.username
      }).populate({
        path: "favorites",
        model: "Post"
      });
      return user;
    },

    getPosts: async (_, args, {
      Post
    }) => {
      const posts = await Post.find({})
        .sort({
          createdDate: "desc"
        })
        .populate({
          path: "createdBy",
          model: "User"
        });
      // console.log(posts);
      return posts;
    },

    getUserPosts: async (_, {
      userId
    }, {
      Post
    }) => {
      const posts = await Post.find({
        createdBy: userId
      });
      return posts;
    },
    getPost: async (_, {
      postId
    }, {
      Post
    }) => {
      const post = await Post.findOne({
        _id: postId
      }).populate({
        path: "messages.messageUser",
        model: "User"
      });
      return post;
    },
    searchPosts: async (_, {
      searchTerm
    }, {
      Post
    }) => {
      if (searchTerm) {
        const searchResults = await Post.find(
            // Perform text search for search value of 'searchTerm'
            {
              $text: {
                $search: searchTerm
              }
            },
            // Assign 'searchTerm' a text score to provide best match
            {
              score: {
                $meta: "textScore"
              }
            }
            // Sort results according to that textScore (as well as by likes in descending order)
          )
          .sort({
            score: {
              $meta: "textScore"
            },
            likes: "desc"
          })
          .limit(5);
        return searchResults;
      }
    },
    infiniteScrollPosts: async (_, {
      pageNum,
      pageSize
    }, {
      Post
    }) => {
      let posts;
      if (pageNum === 1) {
        posts = await Post.find({})
          .sort({
            createdDate: "desc"
          })
          .populate({
            path: "createdBy",
            model: "User"
          })
          .limit(pageSize);
      } else {
        // If page number is greater than one, figure out how many documents to skip
        const skips = pageSize * (pageNum - 1);
        posts = await Post.find({})
          .sort({
            createdDate: "desc"
          })
          .populate({
            path: "createdBy",
            model: "User"
          })
          .skip(skips)
          .limit(pageSize);
      }
      const totalDocs = await Post.countDocuments();
      const hasMore = totalDocs > pageSize * pageNum;
      // console.log(posts);
      return {
        posts,
        hasMore
      };
    }
  },
  Mutation: {
    addPost: async (
      _, {
        title,
        imageName,
        categories,
        description,
        creatorId,
        imageBase64
      }, {
        Post,
        pubsub
      }
    ) => {
      // const post = await Post.findOneAndUpdate(
      //   { imageName },
      //   { $set: { title, categories, description, createdBy: creatorId } },
      //   { new: true }
      // );
      // // console.log(post);
      // return post;
      // console.log(imageBase64);
      // console.log(creatorId);
      const newPost = await new Post({
        title,
        imageName,
        categories,
        description,
        createdBy: creatorId,
        imageBase64
      }).save();

      pubsub.publish("POST_ADDED", {
        postAdded: newPost
      });

      // console.log(newPost);
      return newPost;
    },

    updateUserPost: async (
      _, {
        postId,
        userId,
        title,
        categories,
        description
      }, {
        Post
      }
    ) => {
      const post = await Post.findOneAndUpdate(
        // Find post by postId and createdBy
        {
          _id: postId,
          createdBy: userId
        }, {
          $set: {
            title,
            categories,
            description
          }
        }, {
          new: true
        }
      );
      return post;
    },

    deleteUserPost: async (_, {
      postId
    }, {
      Post
    }) => {
      const post = await Post.findOneAndRemove({
        _id: postId
      });
      return post;
    },

    addPostMessage: async (_, {
      messageBody,
      userId,
      postId
    }, {
      Post
    }) => {
      const newMessage = {
        messageBody,
        messageUser: userId
      };
      const post = await Post.findOneAndUpdate(
        // find post by id
        {
          _id: postId
        },
        // prepend (push) new message to beginning of messages array
        {
          $push: {
            messages: {
              $each: [newMessage],
              $position: 0
            }
          }
        },
        // return fresh document after update
        {
          new: true
        }
      ).populate({
        path: "messages.messageUser",
        model: "User"
      });
      return post.messages[0];
    },

    likePost: async (_, {
      postId,
      username
    }, {
      Post,
      User
    }) => {
      // Find Post, add 1 to its 'like' value
      const post = await Post.findOneAndUpdate({
        _id: postId
      }, {
        $inc: {
          likes: 1
        }
      }, {
        new: true
      });
      // Find User, add id of post to its favorites array (which will be populated as Posts)
      const user = await User.findOneAndUpdate({
        username
      }, {
        $addToSet: {
          favorites: postId
        }
      }, {
        new: true
      }).populate({
        path: "favorites",
        model: "Post"
      });
      // Return only likes from 'post' and favorites from 'user'
      return {
        likes: post.likes,
        favorites: user.favorites
      };
    },

    unlikePost: async (_, {
      postId,
      username
    }, {
      Post,
      User
    }) => {
      // Find Post, add -1 to its 'like' value
      const post = await Post.findOneAndUpdate({
        _id: postId
      }, {
        $inc: {
          likes: -1
        }
      }, {
        new: true
      });
      // Find User, remove id of post from its favorites array (which will be populated as Posts)
      const user = await User.findOneAndUpdate({
        username
      }, {
        $pull: {
          favorites: postId
        }
      }, {
        new: true
      }).populate({
        path: "favorites",
        model: "Post"
      });
      // Return only likes from 'post' and favorites from 'user'
      return {
        likes: post.likes,
        favorites: user.favorites
      };
    },

    signinUser: async (_, {
      username,
      password
    }, {
      User
    }) => {
      const user = await User.findOne({
        username
      });
      if (!user || !user.confirmed) {
        throw new Error("User not found/Email verification not done yet");
      }
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error("Invalid password");
      }
      return {
        token: createToken(user, process.env.SECRET, "1hr"),
        confirmed: user.confirmed
      };
    },

    signupUser: async (
      _, {
        username,
        email,
        password
      }, {
        User,
        transporter
      }
    ) => {
      const user = await User.findOne({
        username
      });
      if (user) {
        throw new Error("User already exists");
      }
      const newUser = await new User({
        username,
        email,
        password
      }).save();
      // console.log(newUser);
      // const { email } = newUser;
      const token = createToken(newUser, process.env.SECRET, "2hr");
      const url = `http://localhost:4000/${token}`;

      transporter.sendMail({
        to: email,
        subject: "Confirm Email",
        html: `Please click this email to confirm your email: <a href="${url}">${url}</a>`
      });

      return {
        token,
        emailSent: true
      };
    },

    uploadImage: async (_parent, {
      file,
      username
    }, info) => {
      // console.log(file);

      const {
        createReadStream,
        filename,
        mimetype,
        encoding
      } = await file;
      // const arrayBufferToBase64 = buffer => {
      //   let binary = "";
      //   let bytes = [].slice.call(new Uint8Array(buffer));
      //   bytes.forEach(b => (binary += String.fromCharCode(b)));
      //   console.log(binary);
      //   let base64String = Buffer.from(binary, "binary").toString("base64");
      //   console.log(base64String);
      //   return base64String;
      // };

      const collectionName = username;
      const stream = createReadStream();
      // console.log(stream);
      const gridFSBucket = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: collectionName
      });
      const fileName =
        collectionName + "-" + Date(Date.now()).toString() + "-" + filename;
      // console.log(fileName);
      const uploadStream = gridFSBucket.openUploadStream(fileName, {
        chunkSizeBytes: 1000
      });

      // console.log(uploadStream);
      var imageStream = [];
      let imageBase64 = "";
      stream.on("data", data => {
        // console.log(src);
        imageStream.push(data);
        // console.log(imageBuffer);
      });
      stream.on("end", () => {
        // console.log(imageBuffer);
        const imageBuffer = Buffer.concat(imageStream);
        let binary = "";
        let bytes = [].slice.call(new Uint8Array(imageBuffer));
        bytes.forEach(b => (binary += String.fromCharCode(b)));
        // console.log(binary);
        let base64String = Buffer.from(binary, "binary").toString("base64");

        // console.log(arrayBufferToBase64(imageStream));
        imageBase64 = `data:image/${mimetype};base64,` + base64String;

        // await new Post({
        //   imageName: fileName,
        //   imageBase64
        // }).save();
      });
      // console.log(imageBase64);
      await new Promise((resolve, reject) => {
        stream
          .pipe(uploadStream)
          .on("error", reject)
          .on("finish", resolve);
      });
      // console.log(downloadStream);
      // const post = await Post.findOne({ imageName: fileName });

      return {
        id: uploadStream.id,
        filename: fileName,
        mimetype,
        encoding
      };
    },

    downloadImage: async (_parent, {
      filename,
      username
    }, info) => {
      // const stream = fs.createReadStream();
      // const WriteStream = require("fs-capacitor");
      // const { createReadStream } = await upload;
      // const stream = createReadStream();
      // const { Readable } = require("stream");
      // const stream = new Readable();
      // stream.push(buffer);
      // stream.push(null);
      const collectionName = username;
      const gridFSBucket = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: collectionName
      });
      const newfilename = filename => {
        const posFirst = filename.indexOf("-");
        const posLast = filename.lastIndexOf("-");
        const ownerName = filename.slice(0, posFirst);
        const file = filename.slice(posLast + 1);
        const newFilename = ownerName + "-" + file;

        return newFilename;
      };

      const name = newfilename(filename);
      // const downloadPath = path.join(__dirname, `/\download\/${name}`);
      const downloadPath = `${DOWN_DIR}/${name}`;
      // const downloadBrowser = `${DOWNBROWSER_DIR}/${name}`;
      // console.log(downloadPath);
      const downloadStream = gridFSBucket.openDownloadStreamByName(filename);
      // console.log(downloadStream);
      // const downloadStream = fs.createReadStream(
      //   gridFSBucket.openDownloadStreamByName(filename)
      // );
      // console.log(downloadStream);
      // var chunks = [];
      // downloadStream
      //   .on("data", chunk => {
      //     // console.log(src);
      //     // imageStream.push(data);
      //     chunks += chunk;
      //     // console.log(imageBuffer);
      //     // const downloadStream = fs.createReadStream(data);
      //     // await new promise((resolver, reject) =>
      //     //   downStream
      //     //     .pipe(fs.createWriteStream(path))
      //     //     .on("error", error => {
      //     //       reject(error);
      //     //       // res.send(error);
      //     //     })
      //     //     .on("finish", () => {
      //     //       console.log("done downloading");
      //     //       // res.send('Done Downloading');
      //     //     })
      //     // );
      //   })
      //   .on("end", () => {
      //     // console.log(imageStream);
      //     // const imageBuffer = Buffer.concat(imageStream);
      //     // console.log(streamifier.createReadStream(imageBuffer));
      //     // stream.push(imageBuffer);
      //     // stream.push(null);

      //     // const downloadStream = fs.createReadStream();
      //     var stream = fs.createWriteStream("./download/pic.jpeg");
      //     stream.write(chunks, "binary");
      //     stream.on("finish", () => {
      //       // resolve('File Saved !');
      //       console.log("done downloading");
      //     });
      //     downloadStream.pipe(stream);
      //     // .createReadStream(imageBuffer)
      //     // .pipe(fs.createWriteStream(path))
      //     // .on("error", error => {
      //     //   console.log("Some error occurred in download:" + error);
      //     // })
      //     // .on("finish", () => {
      //     //   console.log("done downloading");
      //     // });
      //   })
      //   .on("error", error => {
      //     console.log("Some error occurred in download:" + error);
      //   });

      // let binary = "";
      // let bytes = [].slice.call(new Uint8Array(imageBuffer));
      // bytes.forEach(b => (binary += String.fromCharCode(b)));
      // let base64String = Buffer.from(binary, "binary").toString("base64");
      // imageBase64 = `data:image/${mimetype};base64,` + base64String;
      // await new Post({
      //   imageName: fileName,
      //   imageBase64
      // }).save();
      // });
      // await new Promise(() => {
      // const downloadResult = downloadStream

      downloadStream
        .pipe(fs.createWriteStream(downloadPath))
        .on("error", error => {
          console.log("Some error occurred in download:" + error);
          // res.send(error);
        })
        .on("finish", () => {
          console.log("done downloading");
          // // fs.copyFile(downloadPath, downloadBrowser, err => {
          // //   if (err) throw err;
          // //   console.log("file was copied");
          // });
          // res.send('Done Downloading');
        });

      // const capacitor = new WriteStream();
      // const destination = fs.createWriteStream(path);

      // // pipe data to the capacitor
      // downloadStream.pipe(capacitor);

      // // read data from the capacitor
      // capacitor
      //   .createReadStream()
      //   // .pipe(/* some slow Transform streams here */)
      //   .pipe(destination);

      // console.log(downloadResult);
      return {
        fileDir: downloadPath
      };
    }
  },

  Subscription: {
    postAdded: {
      subscribe: (_parent, args, {
        pubsub
      }) => {
        // console.log(userId);
        // const post = await Post.findOne({ createdBy: userId });
        console.log("subscription is going");
        // if (!post) {
        //   throw new Error("No posts for this user!");

        // }
        return pubsub.asyncIterator(["POST_ADDED"]);
      }
    }
  }
};