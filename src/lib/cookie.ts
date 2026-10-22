import type { Response } from "express";
import config from "../config/index.js";

export const ACCESS_COOKIE_NAME = "access_token";
export const REFRESH_COOKIE_NAME = "refresh_token";

export const attachTokensToCookie = (
  res: Response,
  accessToken: string,
  refreshToken: string,
) => {
  const accessCookie = serializeCookie(ACCESS_COOKIE_NAME, accessToken, {
    httpOnly: true,
    sameSite: config.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 60 * 60 * 24, // 1d
    path: "/",
    secure: config.NODE_ENV === "production",
  });

  const refreshCookie = serializeCookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    sameSite: config.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 60 * 60 * 24 * 7, // 7d
    path: "/",
    secure: config.NODE_ENV === "production",
  });

  res.setHeader("Set-Cookie", [accessCookie, refreshCookie]);
};
export const clearTokensFromCookie = (res: Response) => {
  const accessCookie = serializeCookie(ACCESS_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: config.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 0,
    path: "/",
    secure: config.NODE_ENV === "production",
    expires: new Date(0),
  });

  const refreshCookie = serializeCookie(REFRESH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: config.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 0,
    path: "/",
    secure: config.NODE_ENV === "production",
    expires: new Date(0),
  });

  res.setHeader("Set-Cookie", [accessCookie, refreshCookie]);
};

function serializeCookie(
  name: string,
  value: string,
  options: {
    httpOnly?: boolean;
    sameSite?: "lax" | "strict" | "none";
    maxAge?: number;
    path?: string;
    secure?: boolean;
    expires?: Date;
  },
) {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (options.httpOnly) parts.push("HttpOnly");
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.secure) parts.push("Secure");
  if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);

  return parts.join(";");
}
