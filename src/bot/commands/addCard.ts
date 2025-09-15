import { Context } from "telegraf";
import { create, parseCard } from "@services/CardService";
import type { Message } from "telegraf/types";
import { ValidationError } from "@errors/ValidationError";

export async function addCard(ctx: Context) {
  const message = ctx.message as Message.TextMessage | undefined;
  if (!message || typeof message.text !== "string") {
    await ctx.reply("Invalid message format.");
    return
  }
  try {

    const parsedCard = await parseCard(message.text);

    await create(parsedCard);

    await ctx.reply("Card created successfully.");

  } catch (err) {

    if (err instanceof ValidationError) {
      await ctx.reply(err.message)
    } else {
      await ctx.reply("Unexpected error occured while creating the card")
    }

  }
}

