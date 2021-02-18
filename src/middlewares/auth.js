const userSchema = require("../users/userSchema");
const jwt = require("jsonwebtoken");

const authorize = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded);
    if (decoded) {
      const user = await userSchema.findById(decoded._id);
      req.user = user;

      next();
    } else {
      const err = new Error("unauthorized");
      next(err);
    }
  } catch (e) {
    console.log(e);
    const err = new Error("something is wrong");
    next(err);
  }
};

const adminMiddleware = async (req, res, next) => {
  // check if user role is admin
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    const error = new Error("You don't have the permission to access as admin");
    error.httpStatusCode = 403;
    next(error);
  }
};

module.exports = {
  authorize,
  adminMiddleware,
};
