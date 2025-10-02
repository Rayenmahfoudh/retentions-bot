import { prisma } from "@core/db"
import { ValidationError } from "@errors/ValidationError";
import { getUserId } from "@core/store";
import { CreateCardData, parsedCard, UpdateCardData } from "@types/cards";
import { findOrCreateDeckId } from "@services/DeckService";
import { CardStatus, type Card, type Deck } from "@prisma/client";
import { Context } from "telegraf";
import { escapeMarkdownV2 } from "@utils/utils";
import { promptGemini } from "./GeminiService";

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

  //Review after 2 hours
  const nextReview = new Date();
  nextReview.setHours(nextReview.getHours() + 2);

  return {
    question: parts[0]!,
    answer: parts[1]!,
    nextReview,
    deckId: deckId,
  };
}


export async function index(deckId: Deck['id']): Promise<Card[]> {
  const cards = await prisma.card.findMany({
    where: {
      deckId: deckId,
      status: {
        not: CardStatus.PENDING
      }
    }
  })

  return cards
}

export async function bulkInsert(cards: CreateCardData[]): Promise<Card[]> {
  const result = await prisma.card.createManyAndReturn({ data: cards })

  return result
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

export async function findById(cardId: Card["id"]): Promise<Card | null> {
  const card = await prisma.card.findUnique({
    where: {
      id: cardId,
    },
  });
  return card;
}

export async function deleteCard(cardId: Card['id']) {
  const result = await prisma.card.delete({ where: { id: cardId } })
  return result
}

export function sendFlashcardMessages(ctx: Context, cards: Card[]) {
  cards.forEach((card: Card) => {
    const escapedCard = `*Question*: ${escapeMarkdownV2(card.question)}\n\n*Answer*: ${escapeMarkdownV2(card.answer)}`;
    ctx.reply(escapedCard, {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Accept', callback_data: `accept_card|${card.id}` },
            { text: '❌ Reject', callback_data: `reject_card|${card.id}` },
          ],
        ],
      },
    });
  });
}

export function formatCardsForDB(cards: parsedCard[], deckId: number) {
  const nextReview = new Date();
  nextReview.setHours(nextReview.getHours() + 2);
  cards.forEach((card) => {
    card.deckId = deckId;
    card.nextReview = nextReview;
  });
}

export async function generateFlashcards(fileContent: string, userId: number): Promise<parsedCard[]> {
  const flashcards = await promptGemini(`
You are a tool converting technical notes into flashcards for fast comprehension and recall.

Transform the following content into an array of JSON objects, where each object has a "question" and "answer" field in the format:
[{"question": "Question text", "answer": "Answer text"}, ...]

Guidelines:
- Make the question concise and direct, as if testing understanding.
- Use neutral, quiz-like phrasing. Prefer formats like "What does ___ mean?" or "Why should you ___?".
- Keep the answer short and factual.
- Return ONLY the array of JSON objects — no explanations, commentary, or extra text.

Content:
${fileContent}
`, userId);

  if (!flashcards) {
    throw new Error('No flashcards generated. Please ensure the file is a valid markdown file.');
  }

  return JSON.parse(flashcards.replace(/^```[\s\S]*?\n|```$/g, ''));
}


export async function toggleStatus(cardId: Card['id'], status: CardStatus) {
  await prisma.card.update({
    where: {
      id: cardId
    },
    data: {
      status: status
    }
  })
}

