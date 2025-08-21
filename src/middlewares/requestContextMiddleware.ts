import { Context } from "telegraf";
import type { RequestContext } from "../store/requestContext.ts";
import { requestContext } from "../store/requestContext.ts";
import { assert } from "console";
import { findByTelegramId } from "../services/UserService.ts";
import { randomUUID } from "crypto";
import { AppError } from "../error/AppError.ts";

export async function requestContextMiddleware(
  ctx: Context,
  next: () => Promise<void>
) {
  try {
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
  } catch (err) {
    throw err;
  }
}
