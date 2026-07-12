process.env.NODE_ENV = "test";
process.env.DB_HOST = process.env.DB_HOST || "localhost";
process.env.DB_PORT = process.env.DB_PORT || "5433";
process.env.DB_USER = process.env.DB_USER || "root";
process.env.DB_PASSWORD = process.env.DB_PASSWORD || "123456";
process.env.DB_NAME = process.env.DB_NAME || "libraryhub";

const request = require("supertest");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = require("../src/app");
const { User, Book, BorrowRecord, sequelize } = require("../models");

describe("Borrow API", () => {
  let token;
  let userId;
  let bookId;
  let borrowRecordId;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await BorrowRecord.destroy({ where: {} });
    await Book.destroy({ where: {} });
    await User.destroy({ where: {} });

    const hashedPassword = await bcrypt.hash("123456", 10);

    const user = await User.create({
      name: "Borrow User",
      email: `borrow${Date.now()}@gmail.com`,
      password: hashedPassword,
      role: "2",
    });

    userId = user.id;
    token = jwt.sign(
      { id: user.id, role: 2 },
      process.env.JWT_SECRET || "secret",
    );

    const book = await Book.create({
      title: "Harry Potter",
      author: "J.K Rowling",
      category: "Fantasy",
      quantity: 5,
    });

    bookId = book.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test("POST /api/borrow", async () => {
    const res = await request(app)
      .post("/api/borrow")
      .set("Authorization", `Bearer ${token}`)
      .send({ bookId });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Borrow book successfully");

    borrowRecordId = res.body.data.id;
  });

  test("POST /api/borrow should reject missing bookId", async () => {
    const res = await request(app)
      .post("/api/borrow")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("bookId is required");
  });

  test("POST /api/borrow should return 404 when book is not found", async () => {
    const res = await request(app)
      .post("/api/borrow")
      .set("Authorization", `Bearer ${token}`)
      .send({ bookId: 999999 });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Book not found");
  });

  test("POST /api/borrow should reject unavailable book", async () => {
    const unavailableBook = await Book.create({
      title: "Unavailable Book",
      author: "No Copies",
      category: "Testing",
      quantity: 0,
    });

    const res = await request(app)
      .post("/api/borrow")
      .set("Authorization", `Bearer ${token}`)
      .send({ bookId: unavailableBook.id });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Book is unavailable");
  });

  test("GET /api/borrow/history should return my borrow records", async () => {
    const createdRecord = await BorrowRecord.create({
      userId,
      bookId,
      status: "BORROWED",
      borrowDate: new Date(),
      returnDate: null,
    });

    const res = await request(app)
      .get("/api/borrow/history")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Get borrow history successfully");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].id).toBe(createdRecord.id);
  });

  test("POST /api/borrow/return", async () => {
    const createdRecord = await BorrowRecord.create({
      userId,
      bookId,
      status: "BORROWED",
      borrowDate: new Date(),
      returnDate: null,
    });

    const res = await request(app)
      .post("/api/borrow/return")
      .set("Authorization", `Bearer ${token}`)
      .send({ borrowRecordId: createdRecord.id });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Return book successfully");
  });

  test("POST /api/borrow/return should reject missing borrowRecordId", async () => {
    const res = await request(app)
      .post("/api/borrow/return")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("borrowRecordId is required");
  });

  test("POST /api/borrow/return should return 404 when borrow record is not found", async () => {
    const res = await request(app)
      .post("/api/borrow/return")
      .set("Authorization", `Bearer ${token}`)
      .send({ borrowRecordId: 999999 });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Borrow record not found");
  });

  test("POST /api/borrow/return should reject another user's borrow record", async () => {
    const otherUser = await User.create({
      name: "Other Borrow User",
      email: `other${Date.now()}@gmail.com`,
      password: "hashed",
      role: "2",
    });

    const createdRecord = await BorrowRecord.create({
      userId: otherUser.id,
      bookId,
      status: "BORROWED",
      borrowDate: new Date(),
      returnDate: null,
    });

    const res = await request(app)
      .post("/api/borrow/return")
      .set("Authorization", `Bearer ${token}`)
      .send({ borrowRecordId: createdRecord.id });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("You cannot return this book");
  });

  test("POST /api/borrow/return should reject already returned book", async () => {
    const createdRecord = await BorrowRecord.create({
      userId,
      bookId,
      status: "RETURNED",
      borrowDate: new Date(),
      returnDate: new Date(),
    });

    const res = await request(app)
      .post("/api/borrow/return")
      .set("Authorization", `Bearer ${token}`)
      .send({ borrowRecordId: createdRecord.id });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Book already returned");
  });

});
