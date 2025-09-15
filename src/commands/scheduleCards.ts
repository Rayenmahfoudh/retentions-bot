import { getCardsDueToday } from "@services/CardService";
import { getRedisClient } from "@core/redis";

const cardsDueToday = await getCardsDueToday();

const redis = await getRedisClient();

if (cardsDueToday) {
  for (const card of cardsDueToday) {
    const unixDueDate = card.nextReview.getTime();
    await redis.zAdd("cardsDue", {
      score: unixDueDate,
      value: JSON.stringify(card),
    });
  }
}
