const express = require("express");
const {
  getRecommendations,
} = require("../controllers/recommendationController");

const router = express.Router();

/**
 * @swagger
 * /api/recommendations:
 *   get:
 *     summary: Get book recommendations from FastAPI service
 *     tags: [Recommendations]
 *     responses:
 *       200:
 *         description: Recommend books successfully
 */
router.get("/", getRecommendations);

module.exports = router;