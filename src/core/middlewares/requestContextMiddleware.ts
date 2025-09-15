import { Context } from "telegraf";
import type { RequestContext } from "@core/store/requestContext";
import { requestContext } from "@core/store/requestContext";
import { assert } from "console";
import { findByTelegramId } from "@services/UserService";
import { randomUUID } from "crypto";
import { AppError } from "@errors/AppError";

export async function requestContextMiddleware(
  ctx: Context,
  next: () => Promise<void>
) {
  assert(ctx.from !== undefined, "ctx.from must be defined");

  const telegramId = ctx.from!.id.toString();

  const user = await findByTelegramId(telegramId);

  if (!user) {
    throw new AppError(
      "User must exist at this point in the middleware chain."
    );
  }

  const contextData: RequestContext = {
    user,
    requestId: randomUUID(),
  };

  return requestContext.run(contextData, async () => {
    await next();
  });
}
