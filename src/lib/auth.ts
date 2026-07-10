import "server-only";

import { timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";

export type AdminUser = {
  id: string;
  username: string;
};

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still compare to reduce timing leaks on length
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * Verify admin credentials from environment variables.
 *
 * Required:
 * - ADMIN_USERNAME
 * - ADMIN_PASSWORD  (plaintext)  OR  ADMIN_PASSWORD_HASH (bcrypt)
 */
export async function verifyCredentials(
  username: string,
  password: string,
): Promise<AdminUser | null> {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminUsername) {
    console.error("ADMIN_USERNAME is not configured");
    return null;
  }

  if (!adminPassword && !adminPasswordHash) {
    console.error("ADMIN_PASSWORD or ADMIN_PASSWORD_HASH must be configured");
    return null;
  }

  if (!safeEqual(username, adminUsername)) {
    // Dummy bcrypt to keep response timing similar when hash is used
    if (adminPasswordHash) {
      await bcrypt.compare(password, adminPasswordHash);
    }
    return null;
  }

  let ok = false;
  if (adminPasswordHash) {
    ok = await bcrypt.compare(password, adminPasswordHash);
  } else if (adminPassword) {
    ok = safeEqual(password, adminPassword);
  }

  if (!ok) return null;

  return {
    id: "admin",
    username: adminUsername,
  };
}
