const express = require("express");
const {
  getDashboardStats,
  getOverdueReminders,
  getUsers,
  updateUserRole,
} = require("../controllers/adminController");
const { authMiddleware, requireAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/test", authMiddleware, requireAdmin, (req, res) => {
  res.status(200).json({
    message: "Admin route works",
  });
});

router.get("/users", authMiddleware, requireAdmin, getUsers);

router.get("/dashboard/stats", authMiddleware, requireAdmin, getDashboardStats);

router.get("/reminders/overdue", authMiddleware, requireAdmin, getOverdueReminders);

router.patch("/users/:id/role", authMiddleware, requireAdmin, updateUserRole);

module.exports = router;
