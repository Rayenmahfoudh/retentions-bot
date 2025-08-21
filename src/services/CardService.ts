import prisma from "../db/client.ts";
import { ValidationError } from "../error/ValidationError.ts";
import { getUserId } from "../store/requestContext.ts";
import type { CreateCardData } from "../types/Cards.ts";
import { findOrCreateDeckId } from "./DeckService.ts";
import { Card } from "@prisma/client";

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
  const deckId = await findOrCreateDeckId(parts[2], userId);

  return {
    question: parts[0],
    answer: parts[1],
    deckId: deckId,
  };
}
