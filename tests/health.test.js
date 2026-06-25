const request = require("supertest");
const app = require("../src/app");

describe("Health API", () => {
  test("GET / should return 200", async () => {
    const res = await request(app).get("/");

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("LibraryHub API is running");
  });
});