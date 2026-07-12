const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");

    req.user = {
      id: decoded.id,
      role: Number(decoded.role),
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

const requireAdmin = (req, res, next) => {
  if (Number(req.user.role) !== 1) {
    return res.status(403).json({ message: "Admin permission required" });
  }

  next();
};

module.exports = {
  authMiddleware,
  requireAdmin,
};