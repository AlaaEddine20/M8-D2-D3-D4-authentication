const jwt = require("jsonwebtoken");
const user = require("../users/userSchema");

const authenticate = async (user) => {
  try {
    const accessToken = await generateAccessToken({ _id: user._id });
    const refreshToken = await generateRefreshToken({ _id: user._id });

    //insert refresh token in user's property array "refreshTokens"
    user.refreshTokens = user.refreshTokens.concat({ token: refreshToken });

    await user.save(); // save the refresh token

    return { token: accessToken, refreshToken: refreshToken };
  } catch (error) {
    throw new Error(error);
  }
};

// generate a new access token for user
const generateAccessToken = async (payload) =>
  new Promise((res, rej) =>
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "15" },
      (err, token) => {
        if (err) rej(err);
        res(token);
      }
    )
  );

const verifyAccessToken = (token) => {
  new Promise((res, rej) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) rej(err);
      res(decoded);
    });
  });
};

const generateRefreshToken = async (payload) =>
  new Promise((res, rej) =>
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1 week" },
      (err, token) => {
        if (err) rej(err);
        res(token);
      }
    )
  );

const verifyRefreshToken = async (token) =>
  new Promise((res, rej) =>
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) rej(err);
      res(decoded);
    })
  );

const refreshToken = async (oldRefreshToken) => {
  // verify old refrersh token
  const decoded = await verifyRefreshToken(oldRefreshToken);

  // check if the old refresh token exists in db
  const user = await user.findOne({ _id: decoded._id });

  if (!user) {
    throw new Error("Access forbidden");
  }
  const currentRefreshToken = user.refreshToken.find(
    (token) => token.token === oldRefreshToken
  );

  if (!currentRefreshToken) {
    throw new Error("Refresh token is wrong");
  }

  const accessToken = await generateAccessToken({ _id: user._id });
  const refreshToken = await generateRefreshToken({ _id: user._id });

  // filter and replace the old refresh token with the new one
  const refreshTokens = user.refreshTokens
    .filter((token) => token.token !== oldRefreshToken)
    .concat({ token: refreshToken });

  user.refreshTokens = [...refreshTokens];

  await user.save();

  return { token: accessToken, refreshToken: refreshToken };
};

module.exports = { verifyAccessToken, authenticate, refreshToken };
