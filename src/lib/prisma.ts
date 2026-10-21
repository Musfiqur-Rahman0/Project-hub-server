import "dotenv/config.js";

import config from "../config/index.js";
import { PrismaClient } from "../generated/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const { connecting_string } = config;

const adapter = new PrismaPg({ connectionString: connecting_string });
const prisma = new PrismaClient({ adapter });

export { prisma };
