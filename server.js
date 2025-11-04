const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = require("./app/models");
const Role = db.role;

// Health check endpoints для мониторинга
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

app.get("/metrics", (req, res) => {
  res.status(200).json({
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    requests: global.requestCount || 0,
    errors: global.errorCount || 0,
  });
});

app.get("/", (req, res) => {
  res.json({ message: "Test lab 4!" });
});

require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);

function initial() {
  return Role.findOrCreate({
    where: { id: 1 },
    defaults: {
      id: 1,
      name: "user",
    },
  }).then(() => {
    return Role.findOrCreate({
      where: { id: 2 },
      defaults: {
        id: 2,
        name: "admin",
      },
    });
  });
}

// Инициализация сервера
const initServer = async (port = process.env.PORT || 8080) => {
  try {
    await db.sequelize.sync({ force: false });
    await initial();

    return new Promise((resolve, reject) => {
      const server = app.listen(port, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`Server is running on port ${port}.`);
          resolve(server);
        }
      });
    });
  } catch (error) {
    console.error("Server initialization failed:", error);
    throw error;
  }
};

// Запуск сервера только если не в тестовом режиме
if (process.env.NODE_ENV !== "test") {
  initServer();
}

module.exports = { app, initServer, db };
