process.env.NODE_ENV = "test";
process.env.DB_HOST = process.env.DB_HOST || "localhost";
process.env.DB_PORT = process.env.DB_PORT || "5433";
process.env.DB_USER = process.env.DB_USER || "root";
process.env.DB_PASSWORD = process.env.DB_PASSWORD || "123456";
process.env.DB_NAME = process.env.DB_NAME || "libraryhub";

const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../src/app");
const { User, Book, BorrowRecord, sequelize } = require("../models");

describe("Overdue Reminder API", () => {
  let adminToken;
  let userToken;
  let user;
  let book;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await BorrowRecord.destroy({ where: {} });
    await Book.destroy({ where: {} });
    await User.destroy({ where: {} });

    const admin = await User.create({
      name: "Reminder Admin",
      email: "reminder-admin@test.com",
      password: "hashed",
      role: "1",
    });

    user = await User.create({
      name: "Reminder User",
      email: "reminder-user@test.com",
      password: "hashed",
      role: "2",
    });

    adminToken = jwt.sign(
      { id: admin.id, role: 1 },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1d" },
    );

    userToken = jwt.sign(
      { id: user.id, role: 2 },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1d" },
    );

    book = await Book.create({
      title: "Reminder Book",
      author: "Reminder Author",
      category: "Admin",
      quantity: 1,
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test("GET /api/admin/reminders/overdue should return simulated reminders for admin", async () => {
    await BorrowRecord.create({
      userId: user.id,
      bookId: book.id,
      status: "BORROWED",
      borrowDate: new Date(),
      dueDate: new Date(Date.now() - 1000),
      returnDate: null,
      fineAmount: 0,
    });

    const res = await request(app)
      .get("/api/admin/reminders/overdue")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Overdue reminders generated successfully");
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      userName: "Reminder User",
      userEmail: "reminder-user@test.com",
      bookTitle: "Reminder Book",
      overdueDays: 1,
      fineAmount: 5000,
    });
    expect(res.body.data[0].message).toContain(
      "Dear Reminder User, your borrowed book 'Reminder Book' is overdue by 1 day(s).",
    );
  });

  test("GET /api/admin/reminders/overdue should reject normal user", async () => {
    const res = await request(app)
      .get("/api/admin/reminders/overdue")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Admin permission required");
  });

  test("GET /api/admin/reminders/overdue should reject unauthenticated request", async () => {
    const res = await request(app).get("/api/admin/reminders/overdue");

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("No token provided");
  });
});
