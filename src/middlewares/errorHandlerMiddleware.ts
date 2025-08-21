import { ValidationError } from "../error/ValidationError.ts";
import { AppError } from "../error/AppError.ts";

export function errorHandlerMiddleware() {
  return async (err, ctx) => {
    let errorMessage = "Unknown error";

    switch (true) {
      case err instanceof ValidationError:
        errorMessage = err.message;
        await ctx.reply(errorMessage);
        break;
      case err instanceof AppError:
        errorMessage = err.message;
        await ctx.reply(`App error: ${errorMessage}`);
        break;
      case err instanceof Error:
        errorMessage = err.message;
        if (process.env.APP_ENV === "dev") {
          await ctx.reply(`Error: ${errorMessage}`);
        } else {
          await ctx.reply(
            "An unexpected error occurred. Please try again later."
          );
        }
        break;
      default:
        await ctx.reply(
          "An unexpected error occurred. Please try again later."
        );
    }

    console.error("Global error handler:", err);
  };
}
