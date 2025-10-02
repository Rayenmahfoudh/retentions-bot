import { Context } from "telegraf";
import { create, deleteCard, parseCard, updateCard } from "@services/CardService";
import type { Message } from "telegraf/types";
import { ValidationError } from "@errors/ValidationError";
import { CardStatus } from "@prisma/client";
import { toggleStatus } from "@services/CardService";
import { handleRecallResult } from "@services/SM2";

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

export async function toggleCardStatusCallback(ctx: Context) {
  const cardId = parseInt(ctx.match[1]!);
  const cardStatus = ctx.match[2];

  const deckToggleStatusButtonText = cardStatus == CardStatus.ACTIVE ? "🚫 Deactivate" : "✅ Activate"
  const nextCardStatus = cardStatus == CardStatus.ACTIVE ? CardStatus.INACTIVE : CardStatus.ACTIVE;

  await toggleStatus(cardId, cardStatus);

  await ctx.editMessageReplyMarkup({
    inline_keyboard: [
      [
        {
          text: deckToggleStatusButtonText,
          callback_data: `toggle_card_status|${cardId}|${nextCardStatus}`,
        },
        { text: '🗑️ Delete', callback_data: `delete_card|${cardId}` },
      ],
    ],
  });



  await ctx.answerCbQuery()
}

export async function deleteCardCallback(ctx: Context) {
  console.log("reached here")
  const cardId = parseInt(ctx.match[1]!);
  await deleteCard(cardId)

  await ctx.deleteMessage()
}

export async function approveCard(ctx: Context) {
  await ctx.answerCbQuery()
  const cardId = parseInt(ctx.match[1]!);
  await updateCard(cardId, { status: CardStatus.ACTIVE })

  await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
}

export async function rejectCard(ctx: Context) {
  await ctx.answerCbQuery()
  const cardId = parseInt(ctx.match[1]!);
  await deleteCard(cardId)

  await ctx.deleteMessage();

}

export async function handleCardRetentionAction(ctx: Context) {
  const recallQuality = parseInt(ctx.match[1]!);
  const cardId = parseInt(ctx.match[2]!);
  await handleRecallResult(recallQuality, cardId);
}
