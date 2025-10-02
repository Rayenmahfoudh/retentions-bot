import { getUserId } from "@core/store";
import { index as indexDecks, toggleStatus } from "@services/DeckService";
import { index as indexCards } from "@services/CardService";
import { Context } from "telegraf";
import { CardStatus } from "@prisma/client";

export async function getDecks(ctx: Context) {
  try {
    const userId = getUserId()
    const decks = await indexDecks(userId);

    decks.forEach(deck => {
      const deckToggleStatusButtonText = deck.isActive ? "🚫 Deactivate" : "✅ Activate";

      const deckPreviewText = `*Deck name:* ${deck.name}`

      ctx.reply(deckPreviewText, {
        parse_mode: 'MarkdownV2',
        reply_markup: {
          inline_keyboard: [
            [
              { text: deckToggleStatusButtonText, callback_data: `toggle_deck_status|${deck.id}|${deck.isActive}` },
              { text: '📚 Show cards', callback_data: `list_deck_cards|${deck.id}` },
            ],
          ],
        },
      });

    });

  } catch (error) {
    console.error(error)
  }
}

export async function toggleDeckStatusCallback(ctx: Context) {
  const deckId = parseInt(ctx.match[1]!);
  const isDeckActive = ctx.match[2] === 'true';

  await toggleStatus(deckId, !isDeckActive)

  const deckToggleStatusButtonText = isDeckActive ? "🚫 Deactivate" : "✅ Activate";
  await ctx.editMessageReplyMarkup({
    inline_keyboard: [
      [
        {
          text: deckToggleStatusButtonText,
          callback_data: `toggle_deck_status|${deckId}|${!isDeckActive}`,
        },
        { text: '📚 Show cards', callback_data: `list_deck_cards|${deckId}` },
      ],
    ],
  });

  await ctx.answerCbQuery();
}

export async function showDeckCardsCallback(ctx: Context) {
  const deckId = parseInt(ctx.match[1]!);
  const cards = await indexCards(deckId);

  if (cards.length == 0) {
    ctx.reply("This deck is empty, addCard question::answer::deckName to add a new card")
    await ctx.answerCbQuery();
    return
  }

  cards.forEach(card => {
    const formattedCard = `*Question*: ${card.question}\n\n*Answer*: ${card.answer}`;
    const cardToggleStatusButtonText = card.status == CardStatus.ACTIVE ? "🚫 Deactivate" : "✅ Activate";
    ctx.reply(formattedCard, {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: cardToggleStatusButtonText,
              callback_data: `toggle_card_status|${card.id}|${card.status}`
            },
            {
              text: "🗑️ Delete",
              callback_data: `delete_card|${card.id}`
            }

          ]
        ]
      }
    })
  });

  await ctx.answerCbQuery();
}
