import { addCard, addTokenCommand, approveCard, deleteCardCallback, handleCardRetentionAction, helpCommand, rejectCard, startCommand, toggleCardStatusCallback } from "@commands";
import prisma from "@core/db/client";
import { ensureUserMiddleware, errorHandlerMiddleware, requestContextMiddleware } from "@core/middlewares";
import { generateFlashcardsFromFile } from "@services/FileService";
import { getDecks, showDeckCardsCallback, toggleDeckStatusCallback } from "bot/commands/deckCommands";
import dotenv from "dotenv";
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";

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

    //////////////////// General commands //////////////////////
    bot.command("start", startCommand);
    bot.command("help", helpCommand);
    bot.command("addToken", addTokenCommand);

    //////////////////// Cards commands //////////////////////
    bot.hears(/^addCard\b/, addCard);

    bot.on(message("document"), generateFlashcardsFromFile)

    //Retention actions
    bot.action(/^select_(\d)\|(\d+)$/, handleCardRetentionAction);

    //Approve AI generated card
    bot.action(/^accept_card\|(\d+)$/, approveCard)

    //Reject AI Generated card
    bot.action(/^reject_card\|(\d+)$/, rejectCard);

    //Toggle card status
    bot.action(/^toggle_card_status\|(\d+)\|(\w+)$/, toggleCardStatusCallback);

    //Delete card
    bot.action(/^delete_card\|(\d+)$/, deleteCardCallback);

    //////////////////// Decks commands //////////////////////
    bot.command("decks", getDecks);

    //Toggle deck status
    bot.action(/^toggle_deck_status\|(\d+)\|(\w+)$/, toggleDeckStatusCallback);

    //Show deck cards
    bot.action(/^list_deck_cards\|(\d+)$/, showDeckCardsCallback);

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
