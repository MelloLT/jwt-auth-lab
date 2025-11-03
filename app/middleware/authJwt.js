const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const db = require("../models");
const User = db.user;
const TokenUsage = db.tokenUsage;

verifyToken = async (req, res, next) => {
  let token = req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({
      message: "No token provided!",
    });
  }

  try {
    const decoded = jwt.verify(token, config.secret);
    const tokenUsage = await TokenUsage.findOne({
      where: {
        tokenId: decoded.tokenId,
        userId: decoded.id,
      },
    });

    if (!tokenUsage) {
      return res.status(401).send({
        message: "Invalid Token!",
      });
    }

    if (tokenUsage.usageCount >= tokenUsage.maxUsage) {
      return res.status(401).send({
        message: "Token usage limit exceeded!",
      });
    }

    if (new Date() > tokenUsage.expiresAt) {
      return res.status(401).send({
        message: "Token expired!",
      });
    }

    // Увеличиваем счетчик использований
    await tokenUsage.update({
      usageCount: tokenUsage.usageCount + 1,
    });

    req.userId = decoded.id;
    req.tokenId = decoded.tokenId;
    next();
  } catch (err) {
    return res.status(401).send({
      message: "Unauthorized!",
    });
  }
};

isAdmin = (req, res, next) => {
  User.findByPk(req.userId).then((user) => {
    user.getRoles().then((roles) => {
      for (let i = 0; i < roles.length; i++) {
        if (roles[i].name === "admin") {
          next();
          return;
        }
      }

      res.status(403).send({
        message: "Require Admin Role!",
      });
      return;
    });
  });
};

const authJwt = {
  verifyToken: verifyToken,
  isAdmin: isAdmin,
};
module.exports = authJwt;
