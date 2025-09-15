import dotenv from "dotenv";
import { Telegraf } from "telegraf";
import { startCommand, addCard, helpCommand } from "@commands";
import prisma from "@core/db/client";
import { requestContextMiddleware, ensureUserMiddleware, errorHandlerMiddleware } from "@core/middlewares";
import { handleRecallResult } from "@services/SM2";

dotenv.config();

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log("Database connected successfully");

    // Init bot
    const bot = new Telegraf(process.env.BOT_TOKEN as string);

    //Middlewares
    bot.use(ensureUserMiddleware);
    bot.use(requestContextMiddleware);

    //Commands
    bot.command("start", startCommand);
    bot.command("help", helpCommand);
    bot.hears(/^addCard\b/, addCard);
    bot.action(/^select_(\d)\|(\d+)$/, async (ctx) => {
      const recallQuality = parseInt(ctx.match[1]!);
      const cardId = parseInt(ctx.match[2]!);
      await handleRecallResult(recallQuality, cardId);
    });

    //Global exception handler
    bot.catch(errorHandlerMiddleware());

    // Launch bot
    await bot.launch();
    console.log("Bot started successfully");

    // Graceful shutdown
    process.once("SIGINT", async () => {
      console.log("Received SIGINT, shutting down gracefully");
      await prisma.$disconnect();
      bot.stop("SIGINT");
    });

    process.once("SIGTERM", async () => {
      console.log("Received SIGTERM, shutting down gracefully");
      await prisma.$disconnect();
      bot.stop("SIGTERM");
    });
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

main();
