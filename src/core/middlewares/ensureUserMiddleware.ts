import { Context } from "telegraf";
import { create, findByTelegramId } from "@services/UserService";

export async function ensureUserMiddleware(
  ctx: Context,
  next: () => Promise<void>
) {
  const user = ctx.from
    ? {
      telegramId: ctx.from.id.toString(),
      username: ctx.from.first_name,
    }
    : undefined;

  if (!user) {
    //TODO: handle these
    console.error("ctx.from is undefined");
    return;
  }

  if (!(await userExist(user.telegramId))) {
    await create(user);
  }

  await next();
}

async function userExist(telegramId: string) {
  const user = await findByTelegramId(telegramId);
  return !!user;
}
