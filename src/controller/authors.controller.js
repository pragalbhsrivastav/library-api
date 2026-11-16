import pool from "../config/db.js";
import { authorSchea } from "../validators/authors.validator.js";
import { idSchema } from "../validators/gobal.validator.js";

export async function getAllAuthors(req, res) {
  const result = await pool.query(`SELECT * FROM authors ORDER BY id`);

  return res.status(200).json({
    authors: result.rows,
  });
}

export async function getAuthorById(req, res) {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid author id" });
  }

  const result = await pool.query(`SELECT * FROM authors WHERE id = $1`, [
    parsed.data,
  ]);

  if (result.rows.length === 0) {
    return res.status(404).json({ message: "Author not found" });
  }

  return res.status(200).json({
    author: result.rows[0],
  });
}

export async function createAuthor(req, res) {
  const parsed = authorSchea.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }

  const { name, nationality, birth_year } = parsed.data;

  const result = await pool.query(
    `INSERT INTO authors (name, nationality, birth_year)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, nationality, birth_year],
  );

  return res.status(201).json({
    message: "Author added",
    author: result.rows[0],
  });
}

export async function deleteAuthor(req, res) {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid author id" });
  }

  const result = await pool.query(
    `DELETE FROM authors WHERE id = $1 RETURNING *`,
    [parsed.data],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: "Author not found" });
  }

  return res.status(200).json({
    message: "Author deleted",
    author: result.rows[0],
  });
}

export async function updateAuthor(req, res) {
  const parsedId = idSchema.safeParse(req.params.id);
  if (!parsedId.success) {
    return res.status(400).json({ message: "Invalid author id" });
  }

  const parsedBody = authorSchea.safeParse(req.body);
  if (!parsedBody.success) {
    return res
      .status(400)
      .json({ message: parsedBody.error.issues[0].message });
  }

  const { name, nationality, birth_year } = parsedBody.data;

  const result = await pool.query(
    `UPDATE authors
     SET name = $1, nationality = $2, birth_year = $3
     WHERE id = $4
     RETURNING *`,
    [name, nationality, birth_year, parsedId.data],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: "Author not found" });
  }

  return res.status(200).json({
    message: "Author updated",
    author: result.rows[0],
  });
}
