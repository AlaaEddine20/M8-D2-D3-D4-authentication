const express = require("express");
const UserSchema = require("./userSchema");
const { authorize } = require("../middlewares/auth");
const { authenticate, refreshToken } = require("../middlewares/tools");

const userRouter = express.Router();

// sign up
userRouter.post("/signup", async (req, res, next) => {
  try {
    const newUser = UserSchema(req.body);
    const { _id } = await newUser.save();
    res.status(201).send(_id);
  } catch (error) {
    next(error);
  }
});

// login
userRouter.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // findByUsername checks the user and compares the password
    const user = await UserSchema.findByUsername(username, password);

    // generate new token with authenticate function from tool.js
    const accessToken = await authenticate(user);

    res.send({ accessToken });
  } catch (error) {
    next(error);
  }
});

userRouter.post("/logout", authorize, async (req, res, next) => {
  try {
    // find the user's refresh token
    req.user.refreshToken = req.user.refreshToken.filter(
      (token) => token.token !== req.body.refreshToken
    );

    await req.user.save();

    res.send();
  } catch (error) {
    next(error);
  }
});

userRouter.post("/refreshToken", authorize, async (req, res, next) => {
  const oldRefreshToken = req.body.oldRefreshToken;

  if (!oldRefreshToken) {
    const error = new Error("Refresh token is missing");
    error.httpStatusCode = 400;
    next(error);
  } else {
    // if the token is ok generate new access token and new refresh token
    try {
      const newTokens = await refreshToken(oldRefreshToken);
      res.send(newTokens);
    } catch (error) {
      next(error);
    }
  }
});

userRouter.post("/logoutAll", authorize, async (req, res, next) => {
  try {
    req.user.refreshTokens = [];
    await req.user.save();
    res.send();
  } catch (err) {
    next(err);
  }
});

// get users
userRouter.get("/", authorize, async (req, res, next) => {
  try {
    const users = await UserSchema.find();
    res.status(200).send(users);
  } catch (error) {
    next(error);
  }
});

// get single user by username
userRouter.get("/me", authorize, async (req, res, next) => {
  try {
    const user = await UserSchema.findByUsername(username);
    res.send(user);
  } catch (error) {
    next(error);
  }
});

// modify user credentials
userRouter.put("/me", authorize, async (req, res, next) => {
  try {
    const updates = Object.keys(req.body);
    console.log(updates);

    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    res.send(req.user);

    res.send(updates);
  } catch (error) {
    next(error);
  }
});

userRouter.delete("/me", authorize, async (req, res, next) => {
  try {
    await req.user.deleteOne();
    res.status(204).send("Deleted");
  } catch (error) {
    next(error);
  }
});

module.exports = userRouter;
