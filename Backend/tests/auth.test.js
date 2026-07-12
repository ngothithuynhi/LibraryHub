process.env.NODE_ENV = "test";
process.env.DB_HOST = process.env.DB_HOST || "localhost";
process.env.DB_PORT = process.env.DB_PORT || "5433";
process.env.DB_USER = process.env.DB_USER || "root";
process.env.DB_PASSWORD = process.env.DB_PASSWORD || "123456";
process.env.DB_NAME = process.env.DB_NAME || "libraryhub";

const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const { User, sequelize } = require("../models");

describe("Auth API", () => {
  const email = `test${Date.now()}@gmail.com`;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await User.destroy({ where: {} });
  });

  test("POST /api/auth/register should create user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email,
      password: "123456",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Register successfully");
  });

  test("POST /api/auth/register should reject missing data", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email,
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Name, email and password are required");
  });

  test("POST /api/auth/register should reject duplicate email", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Test User",
      email,
      password: "123456",
    });

    const res = await request(app).post("/api/auth/register").send({
      name: "Another User",
      email,
      password: "123456",
    });

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe("Email already exists");
  });

  test("POST /api/auth/login should return token", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Test User",
      email,
      password: "123456",
    });

    const res = await request(app).post("/api/auth/login").send({
      email,
      password: "123456",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe(2);
  });

  test("POST /api/auth/login should reject unknown email", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "missing@example.com",
      password: "123456",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Invalid email or password");
  });

  test("POST /api/auth/login should reject invalid credentials", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Test User",
      email,
      password: "123456",
    });

    const res = await request(app).post("/api/auth/login").send({
      email,
      password: "wrong-password",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Invalid email or password");
  });

  test("GET /api/auth/me should reject missing token", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("No token provided");
  });

  test("GET /api/auth/me should reject malformed authorization header", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer");

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Invalid token format");
  });

  test("GET /api/auth/me should reject invalid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid-token");

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  test("GET /api/admin/test should reject normal user", async () => {
    const user = await User.create({
      name: "Normal User",
      email: "normal@test.com",
      password: "hashed",
      role: "2",
    });

    const token = jwt.sign(
      { id: user.id, role: 2 },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1d" },
    );

    const res = await request(app)
      .get("/api/admin/test")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Admin permission required");
  });

  test("GET /api/admin/test should allow admin user", async () => {
    const admin = await User.create({
      name: "Admin User",
      email: "admin@test.com",
      password: "hashed",
      role: "1",
    });

    const token = jwt.sign(
      { id: admin.id, role: 1 },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1d" },
    );

    const res = await request(app)
      .get("/api/admin/test")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Admin route works");
  });
});
