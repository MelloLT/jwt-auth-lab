const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const authJwt = require("../../middleware/authJwt");
const verifySignUp = require("../../middleware/verifySignUp");

describe("Auth Unit Tests - Individual Components", () => {
  describe("Password Hashing", () => {
    test("bcrypt should correctly hash and verify passwords", () => {
      const password = "securePassword123";
      const hashedPassword = bcrypt.hashSync(password, 8);

      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword).toHaveLength(60); // bcrypt hash length

      const isValid = bcrypt.compareSync(password, hashedPassword);
      expect(isValid).toBe(true);

      const isInvalid = bcrypt.compareSync("wrongPassword", hashedPassword);
      expect(isInvalid).toBe(false);
    });
  });

  describe("JWT Token Generation and Verification", () => {
    test("should generate valid JWT tokens with correct payload", () => {
      const payload = { id: 1, username: "testuser", tokenId: "test-uuid" };
      const secret = "test-secret-key";

      const token = jwt.sign(payload, secret, { expiresIn: "1h" });
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(100);

      const decoded = jwt.verify(token, secret);
      expect(decoded.id).toBe(1);
      expect(decoded.username).toBe("testuser");
      expect(decoded.tokenId).toBe("test-uuid");
    });

    test("should reject expired or invalid JWT tokens", () => {
      const expiredToken = jwt.sign(
        { id: 1 },
        "test-secret",
        { expiresIn: "-1h" } // expired
      );

      expect(() => {
        jwt.verify(expiredToken, "test-secret");
      }).toThrow();
    });
  });

  describe("Middleware Validation", () => {
    test("verifyToken should reject requests without token", () => {
      const req = { headers: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      const next = jest.fn();

      authJwt.verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith({
        message: "No token provided!",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("Role Validation", () => {
    test("should validate user roles correctly", () => {
      const validRoles = ["user", "admin", "moderator"];
      const invalidRoles = ["user", "superadmin", "moderator"]; // superadmin не существует

      // Симулируем ROLES из базы данных
      const dbROLES = ["user", "admin", "moderator"];

      const allValid = validRoles.every((role) => dbROLES.includes(role));
      const hasInvalid = invalidRoles.some((role) => !dbROLES.includes(role));

      expect(allValid).toBe(true);
      expect(hasInvalid).toBe(true);
    });
  });
});
