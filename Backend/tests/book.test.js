process.env.NODE_ENV = "test";
process.env.DB_HOST = process.env.DB_HOST || "localhost";
process.env.DB_PORT = process.env.DB_PORT || "5433";
process.env.DB_USER = process.env.DB_USER || "root";
process.env.DB_PASSWORD = process.env.DB_PASSWORD || "123456";
process.env.DB_NAME = process.env.DB_NAME || "libraryhub";

const request = require("supertest");
const app = require("../src/app");
const jwt = require("jsonwebtoken");
const { User, Book, sequelize } = require("../models");

describe("Book API", () => {
  let adminToken;
  let bookId;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    const admin = await User.create({
      name: "Admin",
      email: "admin@test.com",
      password: "hashed",
      role: "1",
    });

    adminToken = jwt.sign(
      { id: admin.id, role: 1 },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1d" },
    );
  });

  beforeEach(async () => {
    await Book.destroy({ where: {} });
    await User.destroy({ where: {} });

    const admin = await User.create({
      name: "Admin",
      email: "admin@test.com",
      password: "hashed",
      role: "1",
    });

    adminToken = jwt.sign(
      { id: admin.id, role: 1 },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1d" },
    );
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test("POST /api/books should create book", async () => {
    const res = await request(app)
      .post("/api/books")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Clean Code",
        author: "Robert C. Martin",
        category: "Programming",
        quantity: 5,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Create book successfully");
    expect(res.body.data.title).toBe("Clean Code");

    bookId = res.body.data.id;
  });

  test("POST /api/books should reject missing fields", async () => {
    const res = await request(app)
      .post("/api/books")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Clean Code",
        author: "Robert C. Martin",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Missing required fields");
  });

  test("GET /api/books should return books", async () => {
    await Book.create({
      title: "Clean Code",
      author: "Robert C. Martin",
      category: "Programming",
      quantity: 5,
    });

    const res = await request(app).get("/api/books");

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Get books successfully");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /api/books/:id should return one book", async () => {
    const created = await Book.create({
      title: "Clean Code",
      author: "Robert C. Martin",
      category: "Programming",
      quantity: 5,
    });
    const res = await request(app).get(`/api/books/${created.id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Get book successfully");
    expect(res.body.data.id).toBe(created.id);
  });

  test("GET /api/books/:id should return 404 when book is not found", async () => {
    const res = await request(app).get("/api/books/999999");

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Book not found");
  });

  test("PUT /api/books/:id should update book", async () => {
    const created = await Book.create({
      title: "Clean Code",
      author: "Robert C. Martin",
      category: "Programming",
      quantity: 5,
    });
    const res = await request(app)
      .put(`/api/books/${created.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Clean Code Updated",
        author: "Robert C. Martin",
        category: "Software Engineering",
        quantity: 10,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Update book successfully");
    expect(res.body.data.title).toBe("Clean Code Updated");
  });

  test("PUT /api/books/:id should return 404 when book is not found", async () => {
    const res = await request(app)
      .put("/api/books/999999")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Missing Book",
        author: "Unknown",
        category: "Programming",
        quantity: 1,
      });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Book not found");
  });

  test("DELETE /api/books/:id should delete book", async () => {
    const created = await Book.create({
      title: "Clean Code",
      author: "Robert C. Martin",
      category: "Programming",
      quantity: 5,
    });
    const res = await request(app)
      .delete(`/api/books/${created.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Delete book successfully");
  });

  test("DELETE /api/books/:id should return 404 when book is not found", async () => {
    const res = await request(app)
      .delete("/api/books/999999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Book not found");
  });
});
