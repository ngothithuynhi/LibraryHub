const request = require("supertest");
const app = require("../src/app");
const axios = require("axios");
const { sequelize } = require("../models");

jest.mock("axios");

describe("Recommendation API", () => {
  test("GET /api/recommendations should return recommendations", async () => {
    axios.get.mockResolvedValue({
      data: {
        message: "Recommend books successfully",
        data: {
          newestBooks: ["Harry Potter"],
          mostBorrowedBooks: ["Harry Potter"],
        },
      },
    });

    const res = await request(app).get("/api/recommendations");

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Recommend books successfully");
  });

  afterAll(async () => {
    await sequelize.close();
  });
});