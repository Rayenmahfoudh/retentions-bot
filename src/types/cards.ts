export interface CreateCardData {
  question: string;
  answer: string;
  nextReview: Date;
  deckId: number;
}

export interface UpdateCardData {
  question?: string;
  answer?: string;
  repetitions?: number;
  interval?: number;
}
