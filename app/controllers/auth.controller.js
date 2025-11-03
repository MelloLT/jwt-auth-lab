const db = require("../models");
const config = require("../config/auth.config");
const User = db.user;
const Role = db.role;
const TokenUsage = db.tokenUsage;

const Op = db.Sequelize.Op;

let jwt = require("jsonwebtoken");
let bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

exports.signup = (req, res) => {
  User.create({
    username: req.body.username,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8),
  })
    .then((user) => {
      if (req.body.roles) {
        Role.findAll({
          where: {
            name: {
              [Op.or]: req.body.roles,
            },
          },
        }).then((roles) => {
          user.setRoles(roles).then(() => {
            res.send({ message: "User registered successfully!" });
          });
        });
      } else {
        user.setRoles([1]).then(() => {
          res.send({ message: "User registered successfully!" });
        });
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

exports.signin = (req, res) => {
  User.findOne({
    where: {
      username: req.body.username,
    },
  })
    .then((user) => {
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!",
        });
      }

      const tokenId = uuidv4();
      const accessToken = jwt.sign(
        {
          id: user.id,
          tokenId: tokenId,
        },
        config.secret,
        {
          algorithm: "HS256",
          allowInsecureKeySizes: true,
          expiresIn: 3600,
        }
      );

      const refreshToken = jwt.sign(
        {
          id: user.id,
        },
        config.refreshSecret,
        {
          algorithm: "HS256",
          allowInsecureKeySizes: true,
          expiresIn: 86400,
        }
      );

      user.update({ refreshToken: refreshToken });

      TokenUsage.create({
        tokenId: tokenId,
        userId: user.id,
        usageCount: 0,
        maxUsage: 5,
        expiresAt: new Date(Date.now() + 3600 * 1000),
      });

      var authorities = [];
      user.getRoles().then((roles) => {
        for (let i = 0; i < roles.length; i++) {
          authorities.push("ROLE_" + roles[i].name.toUpperCase());
        }
        res.status(200).send({
          id: user.id,
          username: user.username,
          email: user.email,
          roles: authorities,
          accessToken: accessToken,
          refreshToken: refreshToken,
          tokenId: tokenId,
        });
      });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

exports.refreshToken = (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(403).send({ message: "Refresh Token is required!" });
  }

  jwt.verify(refreshToken, config.refreshSecret, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Invalid Refresh Token!" });
    }

    User.findByPk(decoded.id)
      .then((user) => {
        if (!user || user.refreshToken !== refreshToken) {
          return res.status(401).send({ message: "Invalid Refresh Token!" });
        }

        const tokenId = uuidv4();
        const newAccessToken = jwt.sign(
          {
            id: user.id,
            tokenId: tokenId,
          },
          config.secret,
          {
            algorithm: "HS256",
            allowInsecureKeySizes: true,
            expiresIn: 3600,
          }
        );

        const newRefreshToken = jwt.sign(
          {
            id: user.id,
          },
          config.refreshSecret,
          {
            algorithm: "HS256",
            allowInsecureKeySizes: true,
            expiresIn: 86400,
          }
        );

        user.update({ refreshToken: newRefreshToken });

        TokenUsage.create({
          tokenId: tokenId,
          userId: user.id,
          usageCount: 0,
          maxUsage: 5,
          expiresAt: new Date(Date.now() + 3600 * 1000),
        });

        res.status(200).send({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          tokenId: tokenId,
        });
      })
      .catch((err) => {
        res.status(500).send({ message: err.message });
      });
  });
};
