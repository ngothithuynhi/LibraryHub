const { Book, BorrowRecord, sequelize } = require("../../models");

const borrowBook = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const userId = req.user.id;
    const { bookId } = req.body;

    if (!bookId) {
      await transaction.rollback();
      return res.status(400).json({ message: "bookId is required" });
    }

    const book = await Book.findByPk(bookId, { transaction });

    if (!book) {
      await transaction.rollback();
      return res.status(404).json({ message: "Book not found" });
    }

    if (book.quantity <= 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "Book is unavailable" });
    }

    await book.update(
      { quantity: book.quantity - 1 },
      { transaction }
    );

    const borrowRecord = await BorrowRecord.create(
      {
        userId,
        bookId,
        status: "BORROWED",
        borrowDate: new Date(),
        returnDate: null,
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json({
      message: "Borrow book successfully",
      data: borrowRecord,
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ message: error.message });
  }
};

const returnBook = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const userId = req.user.id;
    const { borrowRecordId } = req.body;

    if (!borrowRecordId) {
      await transaction.rollback();
      return res.status(400).json({ message: "borrowRecordId is required" });
    }

    const record = await BorrowRecord.findByPk(borrowRecordId, { transaction });

    if (!record) {
      await transaction.rollback();
      return res.status(404).json({ message: "Borrow record not found" });
    }

    if (record.userId !== userId) {
      await transaction.rollback();
      return res.status(403).json({ message: "You cannot return this book" });
    }

    if (record.status === "RETURNED") {
      await transaction.rollback();
      return res.status(400).json({ message: "Book already returned" });
    }

    const book = await Book.findByPk(record.bookId, { transaction });

    if (!book) {
      await transaction.rollback();
      return res.status(404).json({ message: "Book not found" });
    }

    await record.update(
      {
        status: "RETURNED",
        returnDate: new Date(),
      },
      { transaction }
    );

    await book.update(
      {
        quantity: book.quantity + 1,
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(200).json({
      message: "Return book successfully",
      data: record,
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ message: error.message });
  }
};

const getMyBorrowRecords = async (req, res) => {
  try {
    const userId = req.user.id;

    const records = await BorrowRecord.findAll({
      where: { userId },
      order: [["id", "DESC"]],
    });

    const data = await Promise.all(
      records.map(async (record) => {
        const book = await Book.findByPk(record.bookId);

        return {
          ...record.toJSON(),
          Book: book ? book.toJSON() : null,
        };
      })
    );

    return res.status(200).json({
      message: "Get borrow history successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Cannot get borrow history",
    });
  }
};

module.exports = {
  borrowBook,
  returnBook,
  getMyBorrowRecords,
};