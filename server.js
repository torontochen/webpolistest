const express = require("express");
const http = require("http");
const {
  ApolloServer,
  AuthenticationError,
  PubSub
} = require("apollo-server-express");
// const { upload } = apolloServer.GraphQLUpload;
// const cors = require("cors");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");
const pubsub = new PubSub();
// const fileUpload = require("express-fileupload");
const app = express();
const PORT = 4000;
app.use("/download", express.static("public"));

// app.use(fileUpload());

const transporter = nodemailer.createTransport(
  smtpTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "chenhaoyujc@gmail.com",
      pass: "ally0417"
    }
    // tls:{
    //   rejectUnauthorized:false
    // }
  })
);

// Import typeDefs and resolvers
const filePath = path.join(__dirname, "typeDefs.gql");
const typeDefs = fs.readFileSync(filePath, "utf-8");
const resolvers = require("./resolvers");

// Import Environment Variables and Mongoose Models
require("dotenv").config({ path: "variables.env" });
const User = require("./models/User");
const Post = require("./models/Post");

// Connect to MLab Database
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true
  })
  .then(() => console.log("MongoDB is Connected"))
  .catch(err => console.error(err));
mongoose.set("useCreateIndex", true);

// console.log(mongoose.connection);

app.get("/", (req, res) => {
  res.redirect("/graphql");
});

// Verify JWT Token passed from client
const getUser = async token => {
  if (token) {
    try {
      return await jwt.verify(token, process.env.SECRET);
    } catch (err) {
      throw new AuthenticationError(
        "Your session has ended. Please sign in again."
      );
      // next();
    }
  }
};

// Create Apollo/GraphQL Server using typeDefs, resolvers, and context object
const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: error => ({
    name: error.name,
    message: error.message.replace("Context creation failed:", "")
  }),
  context: async ({ req, connection }) => {
    if (connection) {
      // console.log(connection.context["Authorization"]);
      const token = connection.context["Authorization"];
      return {
        User,
        Post,
        pubsub,
        currentUser: await getUser(token),
        transporter
      };
    } else {
      const token = req.headers["authorization"];
      return {
        User,
        Post,
        pubsub,
        currentUser: await getUser(token),
        transporter
      };
    }
  }
  // uploads: {
  //   maxFileSize: 10000000, // 10 MB
  //   maxFiles: 20
  // }
});

const corsOptions = { credentials: true, origin: "http://localhost:8080" };
server.applyMiddleware({ app, cors: corsOptions });

app.get("/:token", async (req, res) => {
  // console.dir(req.params.token);

  //

  // await models.User.update({ confirmed: true }, { where: { id } });

  try {
    const id = jwt.verify(req.params.token, process.env.SECRET);
    console.log(id.username);
    await User.findOneAndUpdate(
      { username: id.username },
      { $set: { confirmed: true } },
      { new: true }
    );
  } catch (e) {
    res.send("error");
  }

  return res.redirect("http://localhost:8080/signin");
});

// app.listen({ port: process.env.PORT || 4000 }) => {
//   console.log(`Server listening on ${url}`);
// };

// app.listen({ port: 4000 }, () =>
//   console.log(`Server ready at http://localhost:4000${server.graphqlPath}`)
// );

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

httpServer.listen(PORT, () => {
  console.log(
    `🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`
  );
  console.log(
    `🚀 Subscriptions ready at ws://localhost:${PORT}${
      server.subscriptionsPath
    }`
  );
});
