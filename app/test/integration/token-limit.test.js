const request = require("supertest");
const app = require("../../../server");
const db = require("../../models");

describe("Token Usage Limit Tests", () => {
  let limitedAccessToken;

  beforeAll(async () => {
    await db.sequelize.sync();

    // Create test user for token limit testing
    const signupResponse = await request(app).post("/api/auth/signup").send({
      username: "limit_test_user",
      email: "limit@test.com",
      password: "123456",
    });

    const loginResponse = await request(app).post("/api/auth/signin").send({
      username: "limit_test_user",
      password: "123456",
    });

    limitedAccessToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await db.user.destroy({ where: { username: "limit_test_user" } });
    await db.sequelize.close();
  });

  test("should allow 5 requests with same token", async () => {
    for (let i = 1; i <= 5; i++) {
      const response = await request(app)
        .get("/api/test/user")
        .set("x-access-token", limitedAccessToken);

      expect(response.status).toBe(200);
      expect(response.text).toBe("Test User lab4.");
    }
  });

  test("should reject 6th request with token limit exceeded", async () => {
    const response = await request(app)
      .get("/api/test/user")
      .set("x-access-token", limitedAccessToken);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Token usage limit exceeded!");
  });
});
