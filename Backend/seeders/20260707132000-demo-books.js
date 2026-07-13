"use strict";

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert("Books", [
      {
        title: "Clean Code",
        author: "Robert C. Martin",
        category: "Software Engineering",
        quantity: 5,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Refactoring",
        author: "Martin Fowler",
        category: "Software Engineering",
        quantity: 4,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Design Patterns",
        author: "Erich Gamma",
        category: "Programming",
        quantity: 3,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Database System Concepts",
        author: "Abraham Silberschatz",
        category: "Database",
        quantity: 6,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "You Don't Know JS",
        author: "Kyle Simpson",
        category: "JavaScript",
        quantity: 7,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Node.js Design Patterns",
        author: "Mario Casciaro",
        category: "Backend",
        quantity: 4,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Agile Software Development",
        author: "Robert C. Martin",
        category: "Agile",
        quantity: 5,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Software Engineering",
        author: "Ian Sommerville",
        category: "Software Engineering",
        quantity: 8,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("Books", null, {});
  },
};