const { Book, BorrowRecord, sequelize } = require("../../models");
const {
  calculateFineAmount,
  calculateOverdueDays,
  createDueDate,
} = require("../utils/fineCalculator");

const INVALID_DUE_DATE_MESSAGE =
  "Invalid due date. Due date must be between tomorrow and 14 days from today.";

const parseBorrowDueDate = (value, borrowDate) => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const dueDate = new Date(borrowDate);
    dueDate.setFullYear(year, month - 1, day);
    return dueDate;
  }

  return new Date(value);
};

const resolveDueDate = (requestedDueDate, borrowDate) => {
  if (!requestedDueDate) {
    return createDueDate(borrowDate);
  }

  const dueDate = parseBorrowDueDate(requestedDueDate, borrowDate);
  const maxDueDate = createDueDate(borrowDate);

  if (
    Number.isNaN(dueDate.getTime()) ||
    dueDate <= borrowDate ||
    dueDate > maxDueDate
  ) {
    return null;
  }

  return dueDate;
};

const buildBorrowRecordResponse = (record, book = null) => {
  const plainRecord = record.toJSON ? record.toJSON() : record;
  const bookData = book || plainRecord.Book || plainRecord.book || null;
  const compareDate = plainRecord.returnDate || new Date();
  const overdueDays = calculateOverdueDays(plainRecord.dueDate, compareDate);
  const calculatedFineAmount = calculateFineAmount(plainRecord.dueDate, compareDate);
  const storedFineAmount = Number(plainRecord.fineAmount || 0);

  return {
    ...plainRecord,
    Book: bookData,
    book: bookData,
    isOverdue: overdueDays > 0,
    overdueDays,
    fineAmount:
      plainRecord.status === "RETURNED"
        ? storedFineAmount
        : calculatedFineAmount,
  };
};

const borrowBook = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const userId = req.user.id;
    const { bookId, dueDate: requestedDueDate } = req.body;

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

    const borrowDate = new Date();
    const dueDate = resolveDueDate(requestedDueDate, borrowDate);

    if (!dueDate) {
      await transaction.rollback();
      return res.status(400).json({ message: INVALID_DUE_DATE_MESSAGE });
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
        borrowDate,
        returnDate: null,
        dueDate,
        fineAmount: 0,
      },
      { transaction }
    );

    await transaction.commit();

    const borrowRecordResponse = buildBorrowRecordResponse(borrowRecord, book.toJSON());

    return res.status(201).json({
      message: "Borrow book successfully",
      data: borrowRecordResponse,
      borrowRecord: borrowRecordResponse,
      dueDate: borrowRecordResponse.dueDate,
      fineAmount: borrowRecordResponse.fineAmount,
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

    const returnDate = new Date();
    const fineAmount = calculateFineAmount(record.dueDate, returnDate);

    await record.update(
      {
        status: "RETURNED",
        returnDate,
        fineAmount,
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
      data: buildBorrowRecordResponse(record),
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
      include: [
        {
          model: Book,
          as: "book",
          attributes: ["id", "title", "author", "category"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const data = records.map((record) => buildBorrowRecordResponse(record));

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
