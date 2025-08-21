import prisma from "../db/client.ts";
import type { CreateDeckData } from "../types/Decks";
import { Deck } from "@prisma/client";

export async function create(createDeckData: CreateDeckData): Promise<Deck> {
  const createdDeck = await prisma.deck.create({ data: createDeckData });
  return createdDeck;
}

export async function findByName(
  deckName: string,
  userId: number
): Promise<Deck | null> {
  const deck = await prisma.deck.findFirst({
    where: { userId: userId, name: deckName },
  });

  return deck;
}

export async function findDeckId(
  deckName: string,
  userId: number
): Promise<number | null> {
  const deck = await prisma.deck.findFirst({
    where: { userId, name: deckName },
  });
  return deck ? deck.id : null;
}

export async function findOrCreateDeckId(
  deckName: string,
  userId: number
): Promise<number> {
  let deckId = await findDeckId(deckName, userId);

  if (!deckId) {
    const deck = await create({ name: deckName, isActive: true, userId });
    return deck.id;
  }

  return deckId;
}
