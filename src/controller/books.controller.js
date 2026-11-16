import pool from "../config/db.js";
import {
  bookQuerySchema,
  bookSchema,
  myBorrowingsQuerySchema,
  updateBookSchema,
} from "../validators/books.validator.js";
import { idSchema } from "../validators/gobal.validator.js";

const bookSelect = `
  SELECT b.id AS book_id, b.title, b.published_year,
         b.total_copies, b.available_copies,
         a.id AS author_id, a.name AS author_name, a.nationality
  FROM books b
  JOIN authors a ON b.author_id = a.id
`;

const sortColumns = {
  id: "b.id",
  title: "b.title",
  published_year: "b.published_year",
};

export async function getAllBooks(req, res) {
  // 1. Validate the URL options
  const parsed = bookQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }
  const { page, limit, title, author, sort, order } = parsed.data;

  // 2. Build the filter list
  const conditions = [];
  const values = [];

  if (title) {
    values.push(`%${title}%`);
    conditions.push(`b.title ILIKE $${values.length}`);
  }
  if (author) {
    values.push(`%${author}%`);
    conditions.push(`a.name ILIKE $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  // 3. Count how many books match (for the pagination info)
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM books b JOIN authors a ON b.author_id = a.id ${whereClause}`,
    values,
  );
  const total = Number(countResult.rows[0].count);

  // 4. Get only the books for this page
  const sortColumn = sortColumns[sort];
  const sortOrder = order === "desc" ? "DESC" : "ASC";
  const offset = (page - 1) * limit;

  const result = await pool.query(
    `${bookSelect} ${whereClause}
     ORDER BY ${sortColumn} ${sortOrder}, b.id
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset],
  );

  // 5. Send the answer
  return res.status(200).json({
    books: result.rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getBookById(req, res) {
  const parsedId = idSchema.safeParse(req.params.id);
  if (!parsedId.success) {
    return res.status(400).json({ message: "Invalid book id" });
  }

  const result = await pool.query(`${bookSelect} WHERE b.id = $1`, [
    parsedId.data,
  ]);

  if (result.rows.length === 0) {
    return res.status(404).json({ message: "Book not found" });
  }

  return res.status(200).json({ book: result.rows[0] });
}

export async function createBook(req, res) {
  const parsed = bookSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }

  const { title, published_year, author_id, total_copies } = parsed.data;

  const result = await pool.query(
    `INSERT INTO books (title, published_year, author_id, total_copies, available_copies)
     VALUES ($1, $2, $3, $4, $4)
     RETURNING *`,
    [title, published_year, author_id, total_copies],
  );

  return res.status(201).json({
    message: "Book created",
    book: result.rows[0],
  });
}

export async function updateBook(req, res) {
  const parsedId = idSchema.safeParse(req.params.id);
  if (!parsedId.success) {
    return res.status(400).json({ message: "Invalid book id" });
  }

  const parsedBody = updateBookSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res
      .status(400)
      .json({ message: parsedBody.error.issues[0].message });
  }

  const { title, published_year, author_id, total_copies } = parsedBody.data;

  const result = await pool.query(
    `UPDATE books
     SET title = $1,
         published_year = $2,
         author_id = $3,
         available_copies = available_copies + ($4 - total_copies),
         total_copies = $4
     WHERE id = $5
     RETURNING *`,
    [title, published_year, author_id, total_copies, parsedId.data],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: "Book not found" });
  }

  return res.status(200).json({
    message: "Book updated",
    book: result.rows[0],
  });
}

export async function deleteBook(req, res) {
  const parsedId = idSchema.safeParse(req.params.id);
  if (!parsedId.success) {
    return res.status(400).json({ message: "Invalid book id" });
  }

  const result = await pool.query(
    "DELETE FROM books WHERE id = $1 RETURNING *",
    [parsedId.data],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: "Book not found" });
  }

  return res.status(200).json({
    message: "Book deleted",
    book: result.rows[0],
  });
}

export async function borrowBook(req, res) {
  const parsedId = idSchema.safeParse(req.params.id);
  if (!parsedId.success) {
    return res.status(400).json({ message: "Invalid book id" });
  }

  const bookId = parsedId.data;
  const userId = req.user.userId;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const taken = await client.query(
      `UPDATE books
       SET available_copies = available_copies - 1
       WHERE id = $1 AND available_copies >= 1`,
      [bookId],
    );

    if (taken.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Book not available" });
    }

    const loan = await client.query(
      `INSERT INTO borrowings (user_id, book_id, due_date)
       VALUES ($1, $2, NOW() + INTERVAL '14 days')
       RETURNING *`,
      [userId, bookId],
    );

    await client.query("COMMIT");
    return res.status(201).json({
      message: "Book borrowed",
      borrowing: loan.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function returnBook(req, res) {
  // validate id, read userId
  const parsedId = idSchema.safeParse(req.params.id);
  if (!parsedId.success) {
    return res.status(400).json({ message: "Invalid book id" });
  }

  const borrowingId = parsedId.data;
  const userId = req.user.userId;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const returned = await client.query(
      `UPDATE borrowings
       SET returned_at = NOW()
       WHERE id = $1 AND user_id = $2 AND returned_at IS NULL
       RETURNING *`,
      [borrowingId, userId],
    );

    if (returned.rowCount === 0) {
      await client.query("ROLLBACK");

      const loan = await client.query(
        "SELECT user_id FROM borrowings WHERE id = $1",
        [borrowingId],
      );

      if (loan.rows.length === 0 || loan.rows[0].user_id !== userId) {
        return res.status(404).json({ message: "Borrowing not found" });
      }
      return res.status(409).json({ message: "Book already returned" });
    }

    await client.query(
      `UPDATE books SET available_copies = available_copies + 1 WHERE id = $1`,
      [returned.rows[0].book_id],
    );

    await client.query("COMMIT");
    return res
      .status(200)
      .json({ message: "Book returned", borrowing: returned.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function getMyBorrowings(req, res) {
  const parsed = myBorrowingsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }

  const { status } = parsed.data;
  const userId = req.user.userId;

  let statusCondition = "";
  if (status === "active") statusCondition = "AND br.returned_at IS NULL";
  if (status === "returned") statusCondition = "AND br.returned_at IS NOT NULL";

  const result = await pool.query(
    `SELECT br.id AS borrowing_id,
            b.title,
            a.name AS author_name,
            br.borrowed_at,
            br.due_date,
            br.returned_at
     FROM borrowings br
     JOIN books b ON br.book_id = b.id
     JOIN authors a ON b.author_id = a.id
     WHERE br.user_id = $1 ${statusCondition}
     ORDER BY br.borrowed_at DESC, br.id DESC`,
    [userId],
  );

  return res.status(200).json({ borrowings: result.rows });
}
