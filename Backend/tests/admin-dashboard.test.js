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

describe("Admin Dashboard API", () => {
  let adminToken;
  let userToken;
  let admin;
  let user;
  let book;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await BorrowRecord.destroy({ where: {} });
    await Book.destroy({ where: {} });
    await User.destroy({ where: {} });

    admin = await User.create({
      name: "Dashboard Admin",
      email: "dashboard-admin@test.com",
      password: "hashed",
      role: "1",
    });

    user = await User.create({
      name: "Dashboard User",
      email: "dashboard-user@test.com",
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
      title: "Dashboard Book",
      author: "Admin Author",
      category: "Admin",
      quantity: 3,
    });

    await Book.create({
      title: "Second Dashboard Book",
      author: "Admin Author",
      category: "Admin",
      quantity: 4,
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test("GET /api/admin/dashboard/stats should return dashboard stats for admin", async () => {
    await BorrowRecord.create({
      userId: user.id,
      bookId: book.id,
      status: "BORROWED",
      borrowDate: new Date(),
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      returnDate: null,
      fineAmount: 0,
    });

    await BorrowRecord.create({
      userId: user.id,
      bookId: book.id,
      status: "BORROWED",
      borrowDate: new Date(),
      dueDate: new Date(Date.now() - 1000),
      returnDate: null,
      fineAmount: 0,
    });

    await BorrowRecord.create({
      userId: user.id,
      bookId: book.id,
      status: "RETURNED",
      borrowDate: new Date(),
      dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      returnDate: new Date(),
      fineAmount: 10000,
    });

    const res = await request(app)
      .get("/api/admin/dashboard/stats")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Dashboard statistics retrieved successfully");
    expect(res.body.data).toMatchObject({
      totalUsers: 2,
      totalBooks: 2,
      totalBookQuantity: 7,
      totalBorrowRecords: 3,
      activeBorrowRecords: 2,
      returnedBorrowRecords: 1,
      overdueBorrowRecords: 1,
      estimatedTotalFine: 15000,
    });
  });

  test("GET /api/admin/dashboard/stats should reject normal user", async () => {
    const res = await request(app)
      .get("/api/admin/dashboard/stats")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Admin permission required");
  });

  test("GET /api/admin/dashboard/stats should reject unauthenticated request", async () => {
    const res = await request(app).get("/api/admin/dashboard/stats");

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("No token provided");
  });
});
