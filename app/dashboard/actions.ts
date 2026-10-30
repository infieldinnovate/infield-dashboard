"use server";

import { getCurrentUser } from "@/lib/auth";

export async function updateProfileAction() {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false as const, error: "Unauthorized" };
  }

  return {
    success: true as const,
    message: `Profile access confirmed for ${user.name}`,
  };
}
