import { z } from 'zod';

export const courseSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  category: z.string().min(1, "Please select a category"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  thumbnailPath: z.string().optional(), // For now, we'll just take a URL string
});