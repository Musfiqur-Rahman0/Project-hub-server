import { prisma } from "../lib/prisma.js";

export const initDB = async () => {
  try {
    await prisma.$connect();
    console.log("Database connection established successfully.");
  } catch (err) {
    console.error("❌ Failed to connect to the database.");
    console.error(err);
    process.exit(1);
  }
};
