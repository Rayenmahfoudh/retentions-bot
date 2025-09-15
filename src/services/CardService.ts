import { prisma } from "@core/db"
import { ValidationError } from "@errors/ValidationError";
import { getUserId } from "@core/store";
import { CreateCardData, UpdateCardData } from "@types/cards";
import { findOrCreateDeckId } from "@services/DeckService";
import type { Card } from "@prisma/client";

export async function create(createCardData: CreateCardData): Promise<Card> {
  const newCard = await prisma.card.create({ data: createCardData });
  return newCard;
}

export async function parseCard(message: string): Promise<CreateCardData> {
  message = message.replace("addCard", "");
  const parts = message.split("::");

  if (parts.length !== 3 || parts.some((part) => !part.trim())) {
    throw new ValidationError(
      "Invalid card format. Please use 'question::answer::deckName', with all fields filled.",
      400
    );
  }

  //Get or create deck
  const userId = getUserId();
  const deckId = await findOrCreateDeckId(parts[2]!, userId);

  //Review after 2 hours TODO: figure the first review time
  const nextReview = new Date();
  nextReview.setHours(nextReview.getHours() + 2);

  return {
    question: parts[0]!,
    answer: parts[1]!,
    nextReview,
    deckId: deckId,
  };
}

export async function getCardsDueToday(): Promise<Card[] | null> {
  const today = new Date();

  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    0,
    0,
    0,
    0
  );

  const endOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23,
    59,
    59,
    999
  );

  const cards = await prisma.card.findMany({
    where: {
      nextReview: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      deck: {
        select: {
          userId: true,
          user: {
            select: {
              telegramId: true,
            },
          },
        },
      },
    },
  });

  return cards ?? null;
}

export async function updateCard(
  cardId: Card["id"],
  updateCardData: UpdateCardData
) {
  await prisma.card.update({
    where: { id: cardId },
    data: { ...updateCardData },
  });
}

// async function rescheduleCard(ctx: unknown) {
//   //TODO: fix this?
//   const retentionRate = ctx.match[0];
//   const cardId = ctx.match[1];
// }

export async function findById(cardId: Card["id"]): Promise<Card | null> {
  const card = await prisma.card.findUnique({
    where: {
      id: cardId,
    },
  });
  return card;
}
