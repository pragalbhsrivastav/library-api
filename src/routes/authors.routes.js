import express from "express";
import {
  createAuthor,
  deleteAuthor,
  getAllAuthors,
  getAuthorById,
  updateAuthor,
} from "../controller/authors.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public: anyone can read authors
router.get("/", getAllAuthors);
router.get("/:id", getAuthorById);

// Admin only: create, update, delete
router.post("/create", requireAuth, requireRole("admin"), createAuthor);
router.put("/:id", requireAuth, requireRole("admin"), updateAuthor);
router.delete("/:id", requireAuth, requireRole("admin"), deleteAuthor);

export default router;
