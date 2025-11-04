const request = require("supertest");
const { app, initServer, db } = require("../../../server");

describe("Auth Integration Tests - Full JWT Flow", () => {
  let server;
  let testAccessToken;
  let testRefreshToken;

  beforeAll(async () => {
    // Используем случайный порт для тестов
    server = await initServer(0); // 0 = случайный свободный порт

    // Очистка тестовых данных
    await db.user.destroy({ where: {} });
    await db.tokenUsage.destroy({ where: {} });
  }, 30000);

  afterAll(async () => {
    // Корректное закрытие соединений
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await db.sequelize.close();
  }, 30000);

  test("should register a new user with roles", async () => {
    const response = await request(app)
      .post("/api/auth/signup")
      .send({
        username: "integration_test_user",
        email: "integration@test.com",
        password: "123456",
        roles: ["user", "admin"],
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("User registered successfully!");
  });

  test("should login user and return valid JWT tokens", async () => {
    const response = await request(app).post("/api/auth/signin").send({
      username: "integration_test_user",
      password: "123456",
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("accessToken");
    expect(response.body).toHaveProperty("refreshToken");
    expect(response.body).toHaveProperty("tokenId");
    expect(response.body.username).toBe("integration_test_user");
    expect(response.body.roles).toContain("ROLE_USER");
    expect(response.body.roles).toContain("ROLE_ADMIN");

    testAccessToken = response.body.accessToken;
    testRefreshToken = response.body.refreshToken;
  });

  test("should access protected user route with valid JWT token", async () => {
    const response = await request(app)
      .get("/api/test/user")
      .set("x-access-token", testAccessToken);

    expect(response.status).toBe(200);
    expect(response.text).toBe("Test User lab4.");
  });

  test("should access protected admin route with admin role", async () => {
    const response = await request(app)
      .get("/api/test/admin")
      .set("x-access-token", testAccessToken);

    expect(response.status).toBe(200);
    expect(response.text).toBe("Test Admin lab4.");
  });

  test("should refresh access token using refresh token", async () => {
    const response = await request(app).post("/api/auth/refresh").send({
      refreshToken: testRefreshToken,
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("accessToken");
    expect(response.body).toHaveProperty("refreshToken");
    expect(response.body).toHaveProperty("tokenId");

    // Обновляем токен для следующих тестов
    testAccessToken = response.body.accessToken;
    testRefreshToken = response.body.refreshToken;
  });

  test("should reject access to protected routes without token", async () => {
    const response = await request(app).get("/api/test/user");

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("No token provided!");
  });

  test("should reject access with invalid token", async () => {
    const response = await request(app)
      .get("/api/test/user")
      .set("x-access-token", "invalid_token_here");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Unauthorized!");
  });
});
