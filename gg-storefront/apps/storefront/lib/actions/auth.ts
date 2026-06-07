"use server";

import { registerUser, EmailTakenError } from "@/lib/auth/keycloak";

export interface RegisterResult {
  ok: boolean;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Create a Keycloak account. On success the client then signs in with the same
 * credentials (Credentials provider). Returns a serializable result so the
 * branded form can render field errors.
 */
export async function registerAction(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<RegisterResult> {
  const firstName = input.firstName?.trim();
  const lastName = input.lastName?.trim();
  const email = input.email?.trim().toLowerCase();
  const password = input.password ?? "";

  if (!firstName || !lastName) return { ok: false, error: "Enter your first and last name." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };

  try {
    await registerUser({ email, password, firstName, lastName });
    return { ok: true };
  } catch (err) {
    if (err instanceof EmailTakenError) return { ok: false, error: err.message };
    console.error("[auth] registration failed:", err);
    return { ok: false, error: "Could not create your account. Please try again." };
  }
}
