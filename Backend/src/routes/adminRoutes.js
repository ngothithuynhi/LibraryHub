const express = require("express");
const { authMiddleware, requireAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/test", authMiddleware, requireAdmin, (req, res) => {
  res.status(200).json({
    message: "Admin route works",
  });
});

module.exports = router;