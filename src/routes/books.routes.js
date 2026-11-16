import express from "express";
import { borrowBook, createBook, deleteBook, getAllBooks, getBookById, updateBook } from "../controller/books.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getAllBooks);
router.get("/:id", getBookById);
router.post("/", requireAuth, requireRole("admin"), createBook);
router.put("/:id", requireAuth, requireRole("admin"), updateBook);
router.delete("/:id", requireAuth, requireRole("admin"), deleteBook);

// borrow routes
router.post("/:id/borrow", requireAuth, borrowBook);

export default router;