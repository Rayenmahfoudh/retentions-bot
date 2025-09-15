import { getRedisClient } from "@core/redis";
import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import type { Card } from "@prisma/client";
import { AppError } from "@errors/AppError";

dotenv.config();

//GETS THE CARDS FROM REDIS AND SEND THEM VIA TELEGRAM MESSAGE

// Card Sender Worker
async function cardSenderWorker() {
  const redis = await getRedisClient();
  const bot = new Telegraf(process.env.BOT_TOKEN as string);
  if (!bot) {
    throw new AppError("Bot couldn't be initiated")
  }

  /**
   * Retrieves due cards from redis ranked by score
   * @returns Promise<String[]>
   */
  async function retrieveDueCards() {
    const currentUnixTime = new Date().getTime();

    const dueCards = await redis.zRangeByScore("cardsDue", 0, currentUnixTime);
    console.log(`Found ${dueCards.length} due cards`);
    return dueCards;
  }

  async function sendDueCards() {
    const dueCards = await retrieveDueCards();

    dueCards.forEach(async (card) => {
      const parsedCard = JSON.parse(card);
      const userTelegramId = parsedCard.deck.user.telegramId;

      await sendCard(parsedCard, userTelegramId);

      await redis.zRem("cardsDue", card);
    });
  }

  async function sendCard(card: Card, userTelegramId: string) {
    await bot.telegram.sendMessage(
      userTelegramId,
      `${card.question}\n\n||${card.answer}||`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "0", callback_data: `select_0|${card.id}` },
              { text: "1", callback_data: `select_1|${card.id}` },
              { text: "2", callback_data: `select_2|${card.id}` },
              { text: "3", callback_data: `select_3|${card.id}` },
              { text: "4", callback_data: `select_4|${card.id}` },
              { text: "5", callback_data: `select_5|${card.id}` },
            ],
          ],
        },
        parse_mode: "MarkdownV2",
      }
    );
  }

  setInterval(sendDueCards, 15000);
}

cardSenderWorker();
