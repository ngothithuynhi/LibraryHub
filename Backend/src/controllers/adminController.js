const { Op } = require("sequelize");
const { User, Book, BorrowRecord } = require("../../models");
const {
  calculateFineAmount,
  calculateOverdueDays,
} = require("../utils/fineCalculator");

const ROLE_ADMIN = 1;
const ROLE_USER = 2;

const normalizeRole = (role) => {
  if (role === "ADMIN") return ROLE_ADMIN;
  if (role === "USER") return ROLE_USER;

  return Number(role);
};

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email", "role", "createdAt", "updatedAt"],
      order: [["id", "ASC"]],
    });

    return res.status(200).json({
      message: "Get users successfully",
      data: users.map((user) => ({
        ...user.toJSON(),
        role: normalizeRole(user.role),
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (role === undefined || role === null || role === "") {
      return res.status(400).json({ message: "role is required" });
    }

    const normalizedRole = normalizeRole(role);

    if (!Number.isInteger(normalizedRole) || normalizedRole <= 0) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    if (normalizedRole === ROLE_ADMIN) {
      return res.status(400).json({
        message: "Selected role cannot be assigned",
      });
    }

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (normalizeRole(user.role) === ROLE_ADMIN) {
      return res.status(403).json({
        message: "Admin role cannot be edited",
      });
    }

    await user.update({
      role: String(normalizedRole),
    });

    return res.status(200).json({
      message: "Update user role successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: normalizeRole(user.role),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();

    const [
      totalUsers,
      totalBooks,
      totalBookQuantity,
      totalBorrowRecords,
      activeBorrowRecords,
      returnedBorrowRecords,
      overdueRecords,
      returnedFineTotal,
    ] = await Promise.all([
      User.count(),
      Book.count(),
      Book.sum("quantity"),
      BorrowRecord.count(),
      BorrowRecord.count({ where: { status: "BORROWED" } }),
      BorrowRecord.count({ where: { status: "RETURNED" } }),
      BorrowRecord.findAll({
        where: {
          status: "BORROWED",
          dueDate: {
            [Op.lt]: now,
          },
        },
      }),
      BorrowRecord.sum("fineAmount", {
        where: {
          status: "RETURNED",
        },
      }),
    ]);

    const activeOverdueFineTotal = overdueRecords.reduce((total, record) => {
      return total + calculateFineAmount(record.dueDate, now);
    }, 0);

    return res.status(200).json({
      message: "Dashboard statistics retrieved successfully",
      data: {
        totalUsers,
        totalBooks,
        totalBookQuantity: Number(totalBookQuantity || 0),
        totalBorrowRecords,
        activeBorrowRecords,
        returnedBorrowRecords,
        overdueBorrowRecords: overdueRecords.length,
        estimatedTotalFine: Number(returnedFineTotal || 0) + activeOverdueFineTotal,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getOverdueReminders = async (req, res) => {
  try {
    const now = new Date();

    const overdueRecords = await BorrowRecord.findAll({
      where: {
        status: "BORROWED",
        dueDate: {
          [Op.lt]: now,
        },
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"],
        },
        {
          model: Book,
          as: "book",
          attributes: ["id", "title"],
        },
      ],
      order: [["dueDate", "ASC"]],
    });

    const data = overdueRecords.map((record) => {
      const overdueDays = calculateOverdueDays(record.dueDate, now);
      const fineAmount = calculateFineAmount(record.dueDate, now);
      const userName = record.user?.name || "LibraryHub user";
      const userEmail = record.user?.email || "";
      const bookTitle = record.book?.title || "Unknown book";

      return {
        userName,
        userEmail,
        bookTitle,
        dueDate: record.dueDate,
        overdueDays,
        fineAmount,
        message: `Dear ${userName}, your borrowed book '${bookTitle}' is overdue by ${overdueDays} day(s). Please return it as soon as possible.`,
      };
    });

    return res.status(200).json({
      message: "Overdue reminders generated successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  getDashboardStats,
  getOverdueReminders,
  updateUserRole,
};
