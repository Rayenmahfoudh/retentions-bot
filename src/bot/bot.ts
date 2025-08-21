import { Telegraf, Context } from "telegraf";
import dotenv from "dotenv";
import { startCommand } from "./commands/startCommand.ts";

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN as string);

bot.command("start", startCommand);

bot.launch();

//Graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
