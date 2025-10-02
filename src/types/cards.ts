import { CardStatus } from "@prisma/client";

export interface CreateCardData {
  question: string;
  answer: string;
  nextReview: Date;
  deckId: number;
}

export interface UpdateCardData {
  question?: string;
  answer?: string;
  status?: CardStatus;
  repetitions?: number;
  interval?: number;
}

export type parsedCard = {
  question: string,
  answer: string,
  deckId?: number,
  nextReview?: Date
}
