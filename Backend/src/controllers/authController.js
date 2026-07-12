const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../../models");

const ROLE_ADMIN = 1;
const ROLE_USER = 2;

const normalizeRole = (role) => {
  if (role === "ADMIN") return ROLE_ADMIN;
  if (role === "USER") return ROLE_USER;

  return Number(role);
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      role: String(ROLE_USER),
    });

    return res.status(201).json({ message: "Register successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const role = normalizeRole(user.role);

    const token = jwt.sign(
      {
        id: user.id,
        role,
      },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Login successfully",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
};