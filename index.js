const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const app = express();
require("dotenv").config();
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const { Sequelize } = require("sequelize");

const PORT = process.env.PORT || 8090;

const sequelize = new Sequelize(
  process.env.DATABASE,
  process.env.DBUSERNAME,
  process.env.PASSWORD,
  {
    host: "localhost",
    dialect: "postgres",
    dialectOptions: {
      authentication: {
        method: "postgres", //'password'
      },
    },
  }
);

// Check if the connection to the database is successful
sequelize
  .authenticate()
  .then(() => {
    console.log(
      "Connection to the database has been established successfully."
    );

    const sessionStore = new pgSession({
      conString: process.env.DATABASE_URL,
      tableName: "Sessions",
      createTableIfMissing: true,
      ttl: 60 * 60 * 1000,
    });
    app.use(
      session({
        secret: process.env.SESSION_SECRET || "jkf$^JKjk&*()jf",
        resave: false,
        saveUninitialized: false,
        store: sessionStore,
        cookie: { secure: false, expires: 24 * 60 * 60 * 1000 },
      })
    );

    app.use(
      cors({
        credentials: true,
        origin: ["http://localhost:3000"],
      })
    );
    app.use(bodyParser.json());

    const projectRoutes = require("../Backend/routes/project");
    const clientRoutes = require("../Backend/routes/client");
    const costTypeRoutes = require("../Backend/routes/costType");
    const officerRoutes = require("../Backend/routes/officer");
    const transactionRoutes = require("../Backend/routes/transaction");
    const userRoutes = require("../Backend/routes/user");
    const containerRoutes = require("../Backend/routes/container");
    const logsRoutes = require("../Backend/routes/logs");
    app.use("/project", projectRoutes);
    app.use("/client", clientRoutes);
    app.use("/cost", costTypeRoutes);
    app.use("/officer", officerRoutes);
    app.use("/transaction", transactionRoutes);
    app.use("/user", userRoutes);
    app.use("/container", containerRoutes);
    app.use("/logs", logsRoutes);

    app.listen(PORT, () => {
      console.log(`Server is up and running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });
