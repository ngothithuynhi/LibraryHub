const { Op } = require("sequelize");
const { Book } = require("../../models");

const getBooks = async (req, res) => {
  try {
    const books = await Book.findAll({
      order: [["id", "ASC"]],
    });

    return res.status(200).json({
      message: "Get books successfully",
      data: books,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getBookById = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    return res.status(200).json({
      message: "Get book successfully",
      data: book,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const createBook = async (req, res) => {
  try {
    const { title, author, category, quantity } = req.body;

    if (!title || !author || !category || quantity === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const book = await Book.create({
      title,
      author,
      category,
      quantity,
    });

    return res.status(201).json({
      message: "Create book successfully",
      data: book,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateBook = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    await book.update(req.body);

    return res.status(200).json({
      message: "Update book successfully",
      data: book,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteBook = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    await book.destroy();

    return res.status(200).json({
      message: "Delete book successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const searchBooks = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({
        message: "keyword is required",
      });
    }

    const books = await Book.findAll({
      where: {
        [Op.or]: [
          { title: { [Op.iLike]: `%${keyword}%` } },
          { author: { [Op.iLike]: `%${keyword}%` } },
          { category: { [Op.iLike]: `%${keyword}%` } },
        ],
      },
      order: [["id", "ASC"]],
    });

    return res.status(200).json({
      message: "Search books successfully",
      data: books,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  searchBooks,
};