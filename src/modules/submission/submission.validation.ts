import { z } from "zod";

const httpUrlSchema = z
  .string()
  .trim()
  .min(1, "Enter a URL")
  .regex(/^https?:\/\/\S+\.\S+$/i, "Enter a valid URL starting with https://");

export const createSubmissionSchema = z.object({
  projectName: z
    .string()
    .trim()
    .min(3, "Enter a project name (3+ characters)")
    .max(120, "Keep the name under 120 characters"),
  repoUrl: httpUrlSchema.regex(
    /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+\/?$/i,
    "Use a GitHub repository link, like https://github.com/username/repo",
  ),
  liveUrl: httpUrlSchema,
  description: z
    .string()
    .trim()
    .min(50, "Add at least 50 characters so mentors know what to review")
    .max(1000, "Keep the description under 1000 characters"),
});

export type CreateSubmissionPayload = z.infer<typeof createSubmissionSchema>;