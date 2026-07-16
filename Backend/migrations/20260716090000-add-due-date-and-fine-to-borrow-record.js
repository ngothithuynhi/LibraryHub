"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("BorrowRecords", "dueDate", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("BorrowRecords", "fineAmount", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("BorrowRecords", "fineAmount");
    await queryInterface.removeColumn("BorrowRecords", "dueDate");
  },
};
