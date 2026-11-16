import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";

export async function registerController(req, res) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }

  const { email, password } = parsed.data;

  const hash = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users (email, password)
     VALUES ($1, $2)
     RETURNING id, email, role`,
    [email, hash],
  );

  return res.status(201).json({
    message: "Registered successfully",
    data: result.rows[0],
  });
}

export async function loginController(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }

  const { email, password } = parsed.data;

  const result = await pool.query(
    `SELECT id, email, password, role FROM users WHERE email = $1`,
    [email],
  );
  const user = result.rows[0];

  // Same message for unknown email and wrong password,
  // so nobody can find out which emails are registered.
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );

  return res.status(200).json({
    message: "Login successful",
    token,
    user: { id: user.id, email: user.email, role: user.role },
  });
}
