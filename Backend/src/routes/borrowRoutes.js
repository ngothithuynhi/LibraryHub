const express = require("express");
const router = express.Router();

const {
  borrowBook,
  returnBook,
  getMyBorrowRecords,
} = require("../controllers/borrowController");

const { authMiddleware } = require("../middlewares/authMiddleware");

router.post("/", authMiddleware, borrowBook);
router.post("/return", authMiddleware, returnBook);
router.get("/history", authMiddleware, getMyBorrowRecords);

module.exports = router;