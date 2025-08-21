import { Card } from "@prisma/client";

export interface CreateCardData {
  question: string;
  answer: string;
  deckId: number;
}

export interface UpdateCardData {
  question?: string;
  answer?: string;
  difficulty?: Card["difficulty"];
}

export interface ReviewResult {
  cardId: string;
  quality: 0 | 1 | 2 | 3 | 4 | 5; // spaced repetition quality
  reviewedAt: Date;
}
