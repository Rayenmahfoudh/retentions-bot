import { ValidationError } from "@errors/ValidationError";
import { Update } from "telegraf/types";
import { Context } from "telegraf";

export function errorHandlerMiddleware() {
  return async (err: unknown, ctx: Context<Update>) => {
    let errorMessage = "Unknown error";

    if (err instanceof Error) {
      switch (true) {
        case err instanceof ValidationError:
          errorMessage = err.message;
          await ctx.reply(errorMessage);
          break;
        case true:
          errorMessage = err.message;
          if (process.env.APP_ENV === "dev") {
            await ctx.reply(`Error: ${errorMessage}`);
          } else {
            await ctx.reply(
              "An unexpected error occurred. Please try again later."
            );
          }
          break;
      }
    } else {
      await ctx.reply(
        "An unexpected error occurred. Please try again later."
      );
    }

    console.error("Global error handler:", err);
  };
}
