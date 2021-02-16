const express = require("express");
const UserSchema = require("./userSchema");
const { basicAuth } = require("./../middlewares/basicAuth");

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

// get users
userRouter.get("/", basicAuth, async (req, res, next) => {
  try {
    const users = await UserSchema.find();
    res.status(200).send(users);
  } catch (error) {
    next(error);
  }
});

// get single user by username
userRouter.get("/me", basicAuth, async (req, res, next) => {
  try {
    const user = await UserSchema.findOne({ username: req.body.username });
    res.send(user);
  } catch (error) {
    next(error);
  }
});

// modify user credentials
userRouter.put("/me", basicAuth, async (req, res, next) => {
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

userRouter.delete("/me", basicAuth, async (req, res, next) => {
  try {
    await req.user.deleteOne();
    res.status(204).send("Deleted");
  } catch (error) {
    next(error);
  }
});

module.exports = userRouter;
