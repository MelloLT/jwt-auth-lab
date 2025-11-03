module.exports = {
  HOST: process.env.DB_HOST || 'localhost',
  USER: process.env.DB_USER || 'test_adminname',
  PASSWORD: process.env.DB_PASSWORD || 'test_1234password',
  DB: process.env.DB_NAME || 'test_lab4db',
  dialect: "postgres",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};
