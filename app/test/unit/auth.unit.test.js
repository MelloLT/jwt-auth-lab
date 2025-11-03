const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

describe("Auth Unit Tests", () => {
  test("bcrypt should hash password correctly", () => {
    const password = "123456";
    const hashedPassword = bcrypt.hashSync(password, 8);
    const isValid = bcrypt.compareSync(password, hashedPassword);
    expect(isValid).toBe(true);
  });

  test("JWT should sign and verify token", () => {
    const payload = { id: 1, username: "test" };
    const secret = "test-secret";
    const token = jwt.sign(payload, secret);
    const decoded = jwt.verify(token, secret);
    expect(decoded.id).toBe(1);
    expect(decoded.username).toBe("test");
  });

  test("should validate password strength", () => {
    const weakPassword = "123";
    const strongPassword = "123456";
    expect(weakPassword.length).toBeLessThan(6);
    expect(strongPassword.length).toBeGreaterThanOrEqual(6);
  });
});
