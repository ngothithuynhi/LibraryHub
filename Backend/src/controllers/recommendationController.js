const axios = require("axios");

const getRecommendations = async (req, res) => {
  try {
    const pythonServiceUrl =
      process.env.PYTHON_SERVICE || "http://localhost:8000";

    const response = await axios.get(`${pythonServiceUrl}/recommend-books`);

    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get recommendations",
      error: error.message,
    });
  }
};

module.exports = {
  getRecommendations,
};