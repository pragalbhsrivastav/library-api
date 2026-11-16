import express from "express";
import {
  loginController,
  registerController,
} from "../controller/auth.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", registerController);

router.post("/login", loginController);

router.get("/me", requireAuth, (req, res) => {
  return res.status(200).json({ user: req.user });
});

router.get("/admin-only", requireAuth, requireRole("admin"), (req, res) => {
  /* return a message */
  res.status(200).json({ message: "Welcome, admin", user: req.user });
});

export default router;
