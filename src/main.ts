import dotenv from "dotenv";
import { Telegraf } from "telegraf";
import { startCommand } from "./bot/commands/startCommand.ts";
import prisma from "./db/client.ts";
import { requestContextMiddleware } from "./middlewares/requestContextMiddleware.ts";
import { ensureUserMiddleware } from "./middlewares/ensureUserMiddleware.ts";
import { addCard } from "./bot/commands/addCard.ts";
import { ValidationError } from "./error/ValidationError.ts";
import { errorHandlerMiddleware } from "./middlewares/errorHandlerMiddleware.ts";

// Load environment variables
dotenv.config();

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log("Database connected successfully");

    // Initialize bot
    const bot = new Telegraf(process.env.BOT_TOKEN as string);

    //Register middlewares
    bot.use(ensureUserMiddleware);
    bot.use(requestContextMiddleware);

    // Register commands
    bot.command("start", startCommand);
    bot.hears(/^addCard\b/, addCard);

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
