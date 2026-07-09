process.env.NODE_ENV = "test";
process.env.DB_HOST = process.env.DB_HOST || "localhost";
process.env.DB_PORT = process.env.DB_PORT || "5433";
process.env.DB_USER = process.env.DB_USER || "root";
process.env.DB_PASSWORD = process.env.DB_PASSWORD || "123456";
process.env.DB_NAME = process.env.DB_NAME || "libraryhub";

const request = require("supertest");
const app = require("../src/app");
const { Book, sequelize } = require("../models");

describe("Search API", () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await Book.destroy({ where: {} });
    await Book.create({
      title: "Clean Code",
      author: "Robert C. Martin",
      category: "Programming",
      quantity: 5,
    });
  });

  test("GET /api/books/search should search books by keyword", async () => {
    const res = await request(app).get("/api/books/search?keyword=Clean");

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Search books successfully");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /api/books/search should reject missing keyword", async () => {
    const res = await request(app).get("/api/books/search");

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("keyword is required");
  });

  afterAll(async () => {
    await sequelize.close();
  });
});
