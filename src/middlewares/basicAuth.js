const userSchema = require("./../users/userSchema");
const atob = require("atob"); // atob converts base64 in original readable text

const basicAuthMiddleware = async (req, res, next) => {
  if (!req.headers.authorization) {
    const error = new Error("Provide a basic authentication");
    error.httpStatusCOde = 401;
    next(error);
  } else {
    const [username, password] = atob(
      req.headers.authorization.split(" ")[1]
    ).split(":");
    const user = await userSchema.findByUsername(username, password);
    if (!user) {
      const error = new Error("Wrong credentials!");
      error.httpStatusCOde = 401;
      next(error);
    } else {
      req.user = user;
      next();
    }
  }
};

module.exports = {
  basicAuth: basicAuthMiddleware,
};
