const uniqueMessages = {
  users_email_key: "Email already registered",
  unique_name_birth_year: "Author already exists",
  uq_active_borrowing: "You already have this book borrowed",
};

const deleteBlockedMessages = {
  books_author_id_fkey: "Author has books and cannot be deleted",
  borrowings_book_id_fkey: "Book has borrowings and cannot be deleted",
  borrowings_user_id_fkey: "User has borrowings and cannot be deleted",
};

const missingParentMessages = {
  books_author_id_fkey: "Author does not exist",
  borrowings_book_id_fkey: "Book does not exist",
  borrowings_user_id_fkey: "User does not exist",
};

export function notFoundHandler(req, res) {
  return res.status(404).json({ message: "Route not found" });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON body" });
  }

  if (err.code === "23505") {
    return res.status(409).json({
      message: uniqueMessages[err.constraint] || "Resource already exists",
    });
  }

  if (err.code === "23503") {
    if (req.method === "DELETE") {
      return res.status(409).json({
        message:
          deleteBlockedMessages[err.constraint] ||
          "This record is still in use and cannot be deleted",
      });
    }
    return res.status(400).json({
      message:
        missingParentMessages[err.constraint] ||
        "A referenced record does not exist",
    });
  }

  if (err.code === "22P02") {
    return res.status(400).json({ message: "Invalid input" });
  }

  if (err.code === "23514") {
    return res.status(400).json({ message: "Value breaks a data rule" });
  }

  console.error(err);
  return res.status(500).json({ message: "Server error" });
}
