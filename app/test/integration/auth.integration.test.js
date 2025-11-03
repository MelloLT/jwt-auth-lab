const request = require("supertest");
const app = require("../../../server");
const db = require("../../models");

describe("Auth Integration Tests", () => {
  let testUserId;
  let testAccessToken;
  let testRefreshToken;

  beforeAll(async () => {
    // Wait for database sync
    await db.sequelize.sync();
  });

  afterAll(async () => {
    // Cleanup test data
    if (testUserId) {
      await db.user.destroy({ where: { id: testUserId } });
    }
    await db.sequelize.close();
  });

  test("should register a new user", async () => {
    const response = await request(app)
      .post("/api/auth/signup")
      .send({
        username: "integration_test_user",
        email: "integration@test.com",
        password: "123456",
        roles: ["user"],
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("User registered successfully!");
  });

  test("should login user and return tokens", async () => {
    const response = await request(app).post("/api/auth/signin").send({
      username: "integration_test_user",
      password: "123456",
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("accessToken");
    expect(response.body).toHaveProperty("refreshToken");
    expect(response.body).toHaveProperty("tokenId");
    expect(response.body.username).toBe("integration_test_user");

    testUserId = response.body.id;
    testAccessToken = response.body.accessToken;
    testRefreshToken = response.body.refreshToken;
  });

  test("should access protected user route with valid token", async () => {
    const response = await request(app)
      .get("/api/test/user")
      .set("x-access-token", testAccessToken);

    expect(response.status).toBe(200);
    expect(response.text).toBe("Test User lab4.");
  });

  test("should refresh token successfully", async () => {
    const response = await request(app).post("/api/auth/refresh").send({
      refreshToken: testRefreshToken,
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("accessToken");
    expect(response.body).toHaveProperty("refreshToken");
    expect(response.body).toHaveProperty("tokenId");
  });

  test("should reject access without token", async () => {
    const response = await request(app).get("/api/test/user");

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("No token provided!");
  });
});
