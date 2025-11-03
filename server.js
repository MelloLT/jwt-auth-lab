const express = require("express");
const cors = require("cors");

const app = express();

let corsOptions = {
  origin: "http://localhost:8081",
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = require("./app/models");
const Role = db.role;

// Health check endpoints
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get("/metrics", (req, res) => {
  res.json({
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.json({ message: "Test lab 4!" });
});

require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);

function initial() {
  Role.findOrCreate({
    where: { id: 1 },
    defaults: {
      id: 1,
      name: "user",
    },
  });

  Role.findOrCreate({
    where: { id: 2 },
    defaults: {
      id: 2,
      name: "admin",
    },
  });
}

// Only start server if not in test mode
if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 8080;
  db.sequelize.sync().then(() => {
    console.log("Database synced");
    initial();
    console.log(`Server is running on port ${PORT}.`);
  });
} else {
  // For tests, sync database and export server
  db.sequelize.sync().then(() => {
    console.log("Database synced for tests");
    initial();
  });
}

module.exports = app;
