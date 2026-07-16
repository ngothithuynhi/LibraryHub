"use strict";

const bcrypt = require("bcrypt");
const { User, Book, BorrowRecord } = require("../models");

const FINE_PER_OVERDUE_DAY = 5000;
const DEMO_PASSWORD = "123456";

const demoOverdueBorrows = [
  {
    user: {
      name: "Demo Overdue User",
      email: "overdue.user@libraryhub.com",
    },
    book: {
      title: "Demo Overdue Book",
      author: "LibraryHub Demo",
      category: "Demo",
      quantity: 1,
    },
    borrowDaysAgo: 20,
    overdueDays: 6,
  },
  {
    user: {
      name: "Demo Overdue User 2",
      email: "overdue.user.2@libraryhub.com",
    },
    book: {
      title: "Demo Overdue Book 2",
      author: "LibraryHub Demo",
      category: "Demo",
      quantity: 1,
    },
    borrowDaysAgo: 17,
    overdueDays: 3,
  },
];

const dateAtNoonDaysAgo = (daysAgo) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
};

module.exports = {
  async up() {
    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

    for (const demo of demoOverdueBorrows) {
      const [user] = await User.findOrCreate({
        where: { email: demo.user.email },
        defaults: {
          ...demo.user,
          password: hashedPassword,
          role: "2",
        },
      });

      const [book] = await Book.findOrCreate({
        where: {
          title: demo.book.title,
          author: demo.book.author,
        },
        defaults: demo.book,
      });

      const borrowDate = dateAtNoonDaysAgo(demo.borrowDaysAgo);
      const dueDate = dateAtNoonDaysAgo(demo.overdueDays);
      const fineAmount = demo.overdueDays * FINE_PER_OVERDUE_DAY;

      const [borrowRecord, created] = await BorrowRecord.findOrCreate({
        where: {
          userId: user.id,
          bookId: book.id,
          status: "BORROWED",
          returnDate: null,
        },
        defaults: {
          borrowDate,
          dueDate,
          returnDate: null,
          fineAmount,
        },
      });

      if (!created) {
        await borrowRecord.update({
          borrowDate,
          dueDate,
          returnDate: null,
          fineAmount,
        });
      }
    }
  },

  async down() {
    const demoEmails = demoOverdueBorrows.map((demo) => demo.user.email);
    const demoTitles = demoOverdueBorrows.map((demo) => demo.book.title);

    const users = await User.findAll({
      where: { email: demoEmails },
      attributes: ["id"],
    });
    const books = await Book.findAll({
      where: {
        title: demoTitles,
        author: "LibraryHub Demo",
      },
      attributes: ["id"],
    });

    const userIds = users.map((user) => user.id);
    const bookIds = books.map((book) => book.id);

    if (userIds.length > 0 && bookIds.length > 0) {
      await BorrowRecord.destroy({
        where: {
          userId: userIds,
          bookId: bookIds,
          status: "BORROWED",
          returnDate: null,
        },
      });
    }

    await Book.destroy({
      where: {
        title: demoTitles,
        author: "LibraryHub Demo",
      },
    });

    await User.destroy({
      where: { email: demoEmails },
    });
  },
};
