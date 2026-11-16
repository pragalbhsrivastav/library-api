import { z } from "zod";

export const authorSchea = z.object({
  name: z.string().trim().min(3, "Name is required"),
  nationality: z.string().trim().min(3, "Nationality is required"),
  birth_year: z
    .number()
    .int("Birth year must be a whole number")
    .min(1, "Birth year must be a positive year")
    .max(new Date().getFullYear(), "Birth year cannot be in the future")
    .optional(),
});
