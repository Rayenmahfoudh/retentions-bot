import { prisma } from "@core/db";
import type { CreateUserData } from "@types/users";
import type { User } from "@prisma/client";

export async function create(createUserData: CreateUserData): Promise<User> {
  const createdUser = await prisma.user.create({ data: createUserData });
  return createdUser;
}

export async function findByTelegramId(
  telegramId: string
): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { telegramId: telegramId },
  });

  return user ?? null;
}
