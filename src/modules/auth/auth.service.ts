import bcrypt from "bcryptjs";
import jwt, { JsonWebTokenError, JwtPayload } from "jsonwebtoken";

import { Prisma } from "../../generated/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError, AppErrors } from "../../shared/errors/appErrors.js";
import config from "../../config/index.js";
import type {
  AuthTokenPayload,
  AuthTokens,
  AuthUser,
  LoginInput,
  RegisterInput,
} from "./auth.interface.js";
import { decode } from "node:punycode";

const authUserSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
} as const;

type AuthResult = {
  user: AuthUser;
  tokens: AuthTokens;
};

const ACCESS_TOKEN_SECONDS = 60 * 60;
const REFRESH_TOKEN_SECONDS = 60 * 60 * 24 * 7;

export async function register(input: RegisterInput): Promise<AuthUser> {
  const passwordHash = await bcrypt.hash(input.password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        fullName: input.fullName.trim(),
        email: input.email.trim().toLowerCase(),
        passwordHash,
      },
      select: authUserSelect,
    });

    return user;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw AppErrors.conflict("An account with this email already exists");
    }

    throw error;
  }
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const secret = getJwtSecret();
  const user = await prisma.user.findUnique({
    where: { email: input.email.trim().toLowerCase() },
    select: {
      ...authUserSelect,
      passwordHash: true,
      isActive: true,
    },
  });

  if (
    !user ||
    !user.isActive ||
    !(await bcrypt.compare(input.password, user.passwordHash))
  ) {
    throw AppErrors.unauthorized("Email or password is incorrect");
  }

  const {
    passwordHash: password_hash,
    isActive: is_active,
    ...authUser
  } = user;

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return { user: authUser, tokens: createAuthTokens(user.id, secret) };
}

function getJwtSecret(): string {
  const secret = config.JWT_SECRET;
  if (!secret) {
    throw AppErrors.internal("JWT_SECRET is not configured");
  }

  return secret;
}

export function createAuthTokens(userId: string, secret: string): AuthTokens {
  return {
    accessToken: jwt.sign({ userId, tokenType: "access" }, secret, {
      expiresIn: "1d",
    }),
    refreshToken: jwt.sign({ userId, tokenType: "refresh" }, secret, {
      expiresIn: "7d",
    }),
  };
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  let decoded: JwtPayload & Partial<AuthTokenPayload>;

  try {
    decoded = jwt.verify(token, getJwtSecret()) as JwtPayload &
      Partial<AuthTokenPayload>;
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      throw AppErrors.unauthorized("Seasion ended or invalid token");
    }
    throw error;
  }

  if (
    typeof decoded.userId !== "string" ||
    (decoded.tokenType !== "access" && decoded.tokenType !== "refresh")
  ) {
    throw AppErrors.unauthorized("Invalid token");
  }

  return {
    userId: decoded.userId,
    tokenType: decoded.tokenType,
  };
}
