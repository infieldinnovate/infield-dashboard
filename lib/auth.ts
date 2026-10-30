import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { AuthUser } from "./auth-types";
import { mockUser, isMockAuthEnabled } from "./mock-user";

export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  if (isMockAuthEnabled()) {
    return mockUser;
  }
  return null;
});

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "admin") {
    redirect("/forbidden");
  }
  return user;
}
