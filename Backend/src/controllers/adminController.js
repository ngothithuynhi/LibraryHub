const { User } = require("../../models");

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

module.exports = {
  getUsers,
  updateUserRole,
};
