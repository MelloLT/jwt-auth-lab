const request = require("supertest");
const { app, initServer, db } = require("../../../server");

describe("Token Usage Limit Tests - 5 Requests Maximum", () => {
  let server;
  let limitedAccessToken;

  beforeAll(async () => {
    // Используем случайный порт для тестов
    server = await initServer(0);

    // Очистка перед тестами
    await db.user.destroy({ where: {} });
    await db.tokenUsage.destroy({ where: {} });

    // Создание тестового пользователя
    await request(app).post("/api/auth/signup").send({
      username: "limit_test_user",
      email: "limit@test.com",
      password: "123456",
    });

    const loginResponse = await request(app).post("/api/auth/signin").send({
      username: "limit_test_user",
      password: "123456",
    });

    limitedAccessToken = loginResponse.body.accessToken;
  }, 30000);

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await db.sequelize.close();
  }, 30000);

  test("should allow exactly 5 requests with the same JWT token", async () => {
    for (let i = 1; i <= 5; i++) {
      const response = await request(app)
        .get("/api/test/user")
        .set("x-access-token", limitedAccessToken);

      expect(response.status).toBe(200);
      expect(response.text).toBe("Test User lab4.");
      console.log(`Request ${i}/5 successful`);
    }
  });

  test("should reject 6th request with token usage limit exceeded error", async () => {
    const response = await request(app)
      .get("/api/test/user")
      .set("x-access-token", limitedAccessToken);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Token usage limit exceeded!");
  });

  test("should work with new token after refresh", async () => {
    // Получаем новый токен через логин
    const loginResponse = await request(app).post("/api/auth/signin").send({
      username: "limit_test_user",
      password: "123456",
    });

    const newAccessToken = loginResponse.body.accessToken;

    // Новый токен должен работать 5 раз
    const response = await request(app)
      .get("/api/test/user")
      .set("x-access-token", newAccessToken);

    expect(response.status).toBe(200);
    expect(response.text).toBe("Test User lab4.");
  });
});
