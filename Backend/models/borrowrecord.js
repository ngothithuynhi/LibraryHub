'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BorrowRecord extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      BorrowRecord.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });

      BorrowRecord.belongsTo(models.Book, {
        foreignKey: "bookId",
        as: "book",
      });
    }
  }
  BorrowRecord.init({
    userId: DataTypes.INTEGER,
    bookId: DataTypes.INTEGER,
    status: DataTypes.STRING,
    borrowDate: DataTypes.DATE,
    returnDate: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'BorrowRecord',
  });
  return BorrowRecord;
};