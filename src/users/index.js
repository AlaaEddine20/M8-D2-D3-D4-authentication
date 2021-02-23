const express = require("express");
const UserSchema = require("./userSchema");
const { authorize } = require("../middlewares/auth");
const { authenticate, refreshToken } = require("../middlewares/tools");
const jwt = require("jsonwebtoken");
const userRouter = express.Router();

//ogin ->
//checking the credentials
//generating the token with user-id
//returning accessToken

//users/me protected route middleware
//get the token authorization header
//verify this token with jwt.verify() and get the id from the toke
//if token is not expired
// find user by id
//if toke is expired
//request to /refreshtoken -> with refreshToken body
//  verify refreshToken and get _id
//find in db a user bi id
//generate new refresh and accessTokeb
//save refreshToken in db
//send to the user new tokens

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
    console.log("here");
    const { username, password } = req.body;

    const user = await UserSchema.findByUsername(username, password);

    const accessToken = await jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "15 mins" }
    );
    const refreshToken = await jwt.sign(
      { _id: user._id },
      process.env.JWT_REFRESH,
      { expiresIn: "1 week" }
    );
    user.refreshTokens = user.refreshTokens.concat({ token: refreshToken });
    await user.save();

    res.send({ accessToken, refreshToken });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

userRouter.post("/logout", authorize, async (req, res, next) => {
  try {
    // find the user's refresh token
    req.user.refreshTokens = req.user.refreshTokens.filter(
      (token) => token.token !== req.body.refreshToken
    );

    await req.user.save();

    res.send("Logged out");
  } catch (error) {
    next(error);
  }
});

userRouter.post("/refreshToken", async (req, res, next) => {
  try {
    const oldRefreshToken = req.body.oldRefreshToken;
    const decodedRefresh = await jwt.verify(
      oldRefreshToken,
      process.env.JWT_REFRESH
    );
    if (decodedRefresh) {
      const user = await UserSchema.findById(decodedRefresh._id);
      user.refreshTokens = user.refreshTokens.filter(
        (t) => t.token !== oldRefreshToken
      );
      const accessToken = await jwt.sign(
        { _id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "15 mins" }
      );
      const refreshToken = await jwt.sign(
        { _id: user._id },
        process.env.JWT_REFRESH,
        { expiresIn: "1 week" }
      );
      user.refreshTokens = user.refreshTokens.concat({ token: refreshToken });
      await user.save();

      res.send({ refreshToken, accessToken });
    } else {
      const err = new Error("error in refresh");
      next(err);
    }
  } catch (error) {
    console.log(error);
    next(error);
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
    res.send(req.user);
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
