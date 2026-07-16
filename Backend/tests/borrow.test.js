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
  const dayInMilliseconds = 24 * 60 * 60 * 1000;
  const invalidDueDateMessage =
    "Invalid due date. Due date must be between tomorrow and 14 days from today.";
  let token;
  let userId;
  let bookId;
  let borrowRecordId;

  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const toDateInputValue = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

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

  test("POST /api/borrow without dueDate should create default dueDate", async () => {
    const res = await request(app)
      .post("/api/borrow")
      .set("Authorization", `Bearer ${token}`)
      .send({ bookId });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Borrow book successfully");
    expect(res.body.borrowRecord).toBeDefined();
    expect(res.body.borrowRecord.id).toBe(res.body.data.id);
    expect(res.body.dueDate).toBe(res.body.data.dueDate);
    expect(res.body.fineAmount).toBe(0);
    expect(res.body.data.userId).toBe(userId);
    expect(res.body.data.bookId).toBe(bookId);
    expect(res.body.data.status).toBe("BORROWED");
    expect(res.body.data.returnDate).toBeNull();
    expect(res.body.data.dueDate).toBeDefined();
    expect(res.body.data.fineAmount).toBe(0);
    expect(res.body.data.Book).toMatchObject({
      id: bookId,
      title: "Harry Potter",
      author: "J.K Rowling",
    });

    const borrowDate = new Date(res.body.data.borrowDate);
    const dueDate = new Date(res.body.data.dueDate);
    const loanDays = (dueDate.getTime() - borrowDate.getTime()) / dayInMilliseconds;

    expect(loanDays).toBeCloseTo(14, 1);

    borrowRecordId = res.body.data.id;

    const savedRecord = await BorrowRecord.findByPk(borrowRecordId);

    expect(savedRecord.userId).toBe(userId);
    expect(savedRecord.bookId).toBe(bookId);
    expect(savedRecord.status).toBe("BORROWED");
    expect(savedRecord.borrowDate).toBeDefined();
    expect(savedRecord.dueDate).toBeDefined();
    expect(savedRecord.returnDate).toBeNull();
    expect(savedRecord.fineAmount).toBe(0);
  });

  test("POST /api/borrow with valid dueDate should save selected dueDate", async () => {
    const selectedDueDate = toDateInputValue(addDays(new Date(), 7));

    const res = await request(app)
      .post("/api/borrow")
      .set("Authorization", `Bearer ${token}`)
      .send({ bookId, dueDate: selectedDueDate });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Borrow book successfully");
    expect(res.body.dueDate).toBeDefined();

    const borrowDate = new Date(res.body.data.borrowDate);
    const dueDate = new Date(res.body.data.dueDate);
    const selectedDate = new Date(borrowDate);
    const [year, month, day] = selectedDueDate.split("-").map(Number);
    selectedDate.setFullYear(year, month - 1, day);

    expect(dueDate.toISOString()).toBe(selectedDate.toISOString());
  });

  test("POST /api/borrow should reject dueDate before today", async () => {
    const res = await request(app)
      .post("/api/borrow")
      .set("Authorization", `Bearer ${token}`)
      .send({
        bookId,
        dueDate: toDateInputValue(addDays(new Date(), -1)),
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe(invalidDueDateMessage);
  });

  test("POST /api/borrow should reject dueDate equal to today", async () => {
    const res = await request(app)
      .post("/api/borrow")
      .set("Authorization", `Bearer ${token}`)
      .send({
        bookId,
        dueDate: toDateInputValue(new Date()),
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe(invalidDueDateMessage);
  });

  test("POST /api/borrow should reject dueDate more than 14 days from today", async () => {
    const res = await request(app)
      .post("/api/borrow")
      .set("Authorization", `Bearer ${token}`)
      .send({
        bookId,
        dueDate: toDateInputValue(addDays(new Date(), 15)),
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe(invalidDueDateMessage);
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
    const otherUser = await User.create({
      name: "Other History User",
      email: `history-other${Date.now()}@gmail.com`,
      password: "hashed",
      role: "2",
    });
    const dueDate = new Date(Date.now() - 1000);
    const createdRecord = await BorrowRecord.create({
      userId,
      bookId,
      status: "BORROWED",
      borrowDate: new Date(Date.now() - 14 * dayInMilliseconds),
      dueDate,
      returnDate: null,
      fineAmount: 0,
    });

    await BorrowRecord.create({
      userId: otherUser.id,
      bookId,
      status: "BORROWED",
      borrowDate: new Date(),
      dueDate: new Date(Date.now() + dayInMilliseconds),
      returnDate: null,
      fineAmount: 0,
    });

    const res = await request(app)
      .get("/api/borrow/history")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Get borrow history successfully");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(createdRecord.id);
    expect(res.body.data[0].userId).toBe(userId);
    expect(res.body.data[0].bookId).toBe(bookId);
    expect(res.body.data[0].status).toBe("BORROWED");
    expect(res.body.data[0]).toHaveProperty("dueDate");
    expect(res.body.data[0]).toHaveProperty("returnDate");
    expect(res.body.data[0]).toHaveProperty("status");
    expect(res.body.data[0]).toHaveProperty("isOverdue");
    expect(res.body.data[0]).toHaveProperty("overdueDays");
    expect(res.body.data[0]).toHaveProperty("fineAmount");
    expect(res.body.data[0].isOverdue).toBe(true);
    expect(res.body.data[0].overdueDays).toBe(1);
    expect(res.body.data[0].fineAmount).toBe(5000);
    expect(res.body.data[0].Book).toMatchObject({
      id: bookId,
      title: "Harry Potter",
      author: "J.K Rowling",
    });
    expect(res.body.data[0].book).toMatchObject({
      id: bookId,
      title: "Harry Potter",
      author: "J.K Rowling",
    });
  });

  test("GET /api/borrow/history should return newest records first", async () => {
    const now = new Date();
    const newestRecord = await BorrowRecord.create({
      userId,
      bookId,
      status: "BORROWED",
      borrowDate: new Date(now.getTime() - dayInMilliseconds),
      dueDate: new Date(now.getTime() + dayInMilliseconds),
      returnDate: null,
      fineAmount: 0,
      createdAt: new Date(now.getTime() - 1000),
      updatedAt: new Date(now.getTime() - 1000),
    });

    const olderRecord = await BorrowRecord.create({
      userId,
      bookId,
      status: "BORROWED",
      borrowDate: new Date(now.getTime() - 2 * dayInMilliseconds),
      dueDate: new Date(now.getTime() + dayInMilliseconds),
      returnDate: null,
      fineAmount: 0,
      createdAt: new Date(now.getTime() - dayInMilliseconds),
      updatedAt: new Date(now.getTime() - dayInMilliseconds),
    });

    const res = await request(app)
      .get("/api/borrow/history")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.map((record) => record.id)).toEqual([
      newestRecord.id,
      olderRecord.id,
    ]);
  });

  test("POST /api/borrow/return should return on time with zero fine", async () => {
    const createdRecord = await BorrowRecord.create({
      userId,
      bookId,
      status: "BORROWED",
      borrowDate: new Date(),
      dueDate: new Date(Date.now() + dayInMilliseconds),
      returnDate: null,
      fineAmount: 0,
    });

    const res = await request(app)
      .post("/api/borrow/return")
      .set("Authorization", `Bearer ${token}`)
      .send({ borrowRecordId: createdRecord.id });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Return book successfully");
    expect(res.body.data.fineAmount).toBe(0);
    expect(res.body.data.overdueDays).toBe(0);
  });

  test("POST /api/borrow/return should calculate late fine", async () => {
    const dueDate = new Date(Date.now() - (2 * dayInMilliseconds + 1000));
    const createdRecord = await BorrowRecord.create({
      userId,
      bookId,
      status: "BORROWED",
      borrowDate: new Date(Date.now() - 16 * dayInMilliseconds),
      dueDate,
      returnDate: null,
      fineAmount: 0,
    });

    const res = await request(app)
      .post("/api/borrow/return")
      .set("Authorization", `Bearer ${token}`)
      .send({ borrowRecordId: createdRecord.id });

    const returnDate = new Date(res.body.data.returnDate);
    const overdueDays = Math.ceil(
      (returnDate.getTime() - dueDate.getTime()) / dayInMilliseconds,
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Return book successfully");
    expect(res.body.data.overdueDays).toBe(overdueDays);
    expect(res.body.data.fineAmount).toBe(overdueDays * 5000);
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
