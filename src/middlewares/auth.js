const userSchema = require("../users/userSchema");
const { verifyAccessToken } = require("./tools");

const authorize = async (req, res, next) => {
  try {
    // grab the token from the headers
    const token = await req.headers("Authorization").replace("Bearer ", "");
    // decode token from verifyAccessToken function
    const decodedToken = verifyAccessToken(token);

    const user = await userSchema.findOne({
      _id: decodedToken._id,
    });

    if (user) {
      req.token = token; // create new token
      req.user = user; // create new user
      next();
    } else {
      throw new Error();
    }
  } catch (err) {
    const error = new Error("Please authenticate");
    error.httpStatusCode = 401;
    next(error);
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
