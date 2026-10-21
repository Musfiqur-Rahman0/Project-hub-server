import "./env.js";

const config = {
  port: process.env.PORT || 5000,
  connecting_string: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  FRONTEND_URL: process.env.FRONTEND_URL,
};

export default config;
