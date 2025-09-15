import type { Card } from "@prisma/client";
import { findById, updateCard } from "@services/CardService";

export async function handleRecallResult(
  q: number,
  cardId: Card["id"]
): Promise<void> {
  const card = await findById(cardId);
  if (!card) {
    throw new Error("Card not found");
  }

  if (q < 3) {
    handleRetentionFailure(card);
  } else {
    handleRetentionSuccess(card, q);
  }
}

async function handleRetentionFailure(card: Card) {
  const updatedCard = {
    repetitions: 0,
    interval: 1,
  };

  await updateCard(card.id, updatedCard);
}

async function handleRetentionSuccess(card: Card, recallQuality: number) {
  const updatedInterval = determineInterval(
    card.repetitions,
    card.ease_factor,
    card.interval
  );

  const updatedEaseFactor = calculateEaseFactor(
    card.ease_factor,
    recallQuality
  );
  const updatedCard = {
    interval: updatedInterval,
    ease_factor: updatedEaseFactor,
    repetitions: card.repetitions + 1,
  };

  await updateCard(card.id, updatedCard);
}

function determineInterval(
  n: Card["repetitions"],
  EF: Card["ease_factor"],
  previousInterval: Card["interval"]
) {
  switch (n) {
    case 1:
      return 1;
    case 2:
      return 6;
    default:
      return Math.round(previousInterval * EF);
  }
}

function calculateEaseFactor(
  oldEaseFactor: Card["ease_factor"],
  recallQuality: number
): number {
  return (
    oldEaseFactor +
    (0.1 - (5 - recallQuality) * (0.08 + (5 - recallQuality) * 0.02))
  );
}
