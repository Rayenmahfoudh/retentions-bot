import { Context } from "telegraf";
import { create, parseCard } from "../../services/CardService.ts";
import type { Message } from "telegraf/types";

export async function addCard(ctx: Context) {
  try {
    const message = ctx.message as Message.TextMessage | undefined;
    if (!message || typeof message.text !== "string") {
      await ctx.reply("Invalid message format.");
      return;
    }
    const parsedCard = await parseCard(message.text);
    await create(parsedCard);
    await ctx.reply("Card created successfully.");
  } catch (err) {
    throw err;
  }
}
