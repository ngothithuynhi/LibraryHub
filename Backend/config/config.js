require("dotenv").config();

module.exports = {
  development: {
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "123456",
    database: process.env.DB_NAME || "libraryhub",
    host: process.env.DB_HOST || "postgres",
    port: Number(process.env.DB_PORT || 5432),
    dialect: "postgres",
  },

  test: {
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "123456",
    database: process.env.DB_NAME_TEST || "libraryhub_test",
    host: process.env.DB_HOST_TEST || process.env.DB_HOST || "postgres",
    port: Number(process.env.DB_PORT_TEST || process.env.DB_PORT || 5432),
    dialect: "postgres",
  },

  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    dialect: "postgres",
  },
};