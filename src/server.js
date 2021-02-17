const express = require("express");
const mongoose = require("mongoose");
const listEndPoints = require("express-list-endpoints");
const cors = require("cors");

const {
  notFoundHandler,
  forbiddenHandler,
  badRequestHandler,
  genericErrorHandler,
} = require("./errorHandlers");

const usersRouter = require("./users/index");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/users", usersRouter);

// ERROR HANDLERS MIDDLEWARES

app.use(badRequestHandler);
app.use(forbiddenHandler);
app.use(notFoundHandler);
app.use(genericErrorHandler);
console.log(listEndPoints(app));

mongoose.set("debug", true);

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(
    app.listen(process.env.PORT, () => {
      console.log("Server started at port: ", process.env.PORT);
    })
  )
  .catch(console.error);
