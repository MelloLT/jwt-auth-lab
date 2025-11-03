module.exports = (sequelize, Sequelize) => {
  const TokenUsage = sequelize.define("token_usage", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tokenId: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    usageCount: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    maxUsage: {
      type: Sequelize.INTEGER,
      defaultValue: 5, // Ограничение на 10 использований
    },
    expiresAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  });

  return TokenUsage;
};
