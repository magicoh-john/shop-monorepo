"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@my-project/database";
import { registerSchema } from "@/schemas/auth.schema";

export async function register(formData: FormData) {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    name: formData.get("name") as string,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { email, password, name } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "이미 사용 중인 이메일입니다" };

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { email, password: hashedPassword, name },
  });

  return { success: true };
}
