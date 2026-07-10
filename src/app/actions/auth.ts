"use server";

import { redirect } from "next/navigation";
import { verifyCredentials } from "@/lib/auth";
import { createSession, deleteSession, getSession } from "@/lib/session";

export type LoginState = {
  error?: string;
} | undefined;

function sanitizeRedirect(from: unknown): string {
  if (typeof from !== "string" || !from.startsWith("/") || from.startsWith("//")) {
    return "/admin";
  }
  // Avoid open redirect to external or login loop
  if (from.startsWith("/login")) return "/admin";
  return from;
}

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const from = sanitizeRedirect(formData.get("from"));

  if (!username || !password) {
    return { error: "请输入用户名和密码" };
  }

  const user = await verifyCredentials(username, password);
  if (!user) {
    return { error: "用户名或密码错误" };
  }

  await createSession(user.id, user.username);
  redirect(from);
}

export async function logout() {
  await deleteSession();
  redirect("/");
}

export async function getCurrentUser() {
  return getSession();
}
