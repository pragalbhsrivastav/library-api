import { z } from "zod";

export const bookSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title must be at most 255 characters"),
  published_year: z
    .number()
    .int("Published year must be a whole number")
    .min(1, "Published year must be a positive year")
    .max(new Date().getFullYear(), "Published year cannot be in the future")
    .optional(),
  author_id: z
    .number()
    .int("author_id must be a whole number")
    .positive("author_id must be positive"),
  total_copies: z
    .number()
    .int("total_copies must be a whole number")
    .min(1, "total_copies must be at least 1")
    .default(1),
});

export const bookQuerySchema = z.object({
  page: z.coerce
    .number()
    .int("page must be a whole number")
    .min(1, "page must be at least 1")
    .default(1),
  limit: z.coerce
    .number()
    .int("limit must be a whole number")
    .min(1, "limit must be at least 1")
    .max(100, "limit must be at most 100")
    .default(10),
  title: z.string().trim().min(1, "title cannot be empty").optional(),
  author: z.string().trim().min(1, "author cannot be empty").optional(),
  sort: z
    .enum(["id", "title", "published_year"], {
      message: "sort must be one of: id, title, published_year",
    })
    .default("id"),
  order: z
    .enum(["asc", "desc"], { message: "order must be asc or desc" })
    .default("asc"),
});

export const updateBookSchema = bookSchema.extend({
  total_copies: z
    .number()
    .int("total_copies must be a whole number")
    .min(1, "total_copies must be at least 1"),
});


export const myBorrowingsQuerySchema = z.object({
  status: z
    .enum(["active", "returned"], { message: "status must be active or returned" })
    .optional(),
});