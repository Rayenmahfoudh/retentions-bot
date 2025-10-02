import { getUserId } from "@core/store";
import { TokenNotFoundError } from "@errors/TokenNotFoundError";
import { CreateCardData } from "@types/cards";
import * as fs from 'fs';
import { get } from 'https';
import path from "path";
import { Context, Telegram } from "telegraf";
import { Document } from "telegraf/types";
import { URL } from 'url';
import { bulkInsert, formatCardsForDB, generateFlashcards, sendFlashcardMessages } from "./CardService";
import { findOrCreateDeckId } from "./DeckService";
import { parseFile } from "./MarkdownService";


async function validateMessage(ctx: Context) {
  const message = ctx.message;
  if (!message || !('document' in message)) {
    await ctx.reply('Please send a document.');
    throw new Error('No document provided');
  }
  if (!('caption' in message)) {
    await ctx.reply('Please provide a deck name with the document.');
    throw new Error('No caption provided');
  }
  return message;
}

async function processFileContent(document: Document): Promise<string | Error> {
  const savedFilePath = await saveFileLocally(document);
  const fileContent = await parseFile(savedFilePath);

  return fileContent
}

export async function generateFlashcardsFromFile(ctx: Context) {
  try {
    const userId = getUserId();
    const message = await validateMessage(ctx);
    const deckName = message.caption as string;
    const deckId = await findOrCreateDeckId(deckName, userId);

    const fileContent = await processFileContent(message.document);
    if (fileContent instanceof Error) {
      await ctx.reply("Failed to parse file, please try again later or check if its a valid markdown file")
      return
    }

    const parsedCards = await generateFlashcards(fileContent, userId);

    formatCardsForDB(parsedCards, deckId);
    const cards = await bulkInsert(parsedCards as CreateCardData[]);

    sendFlashcardMessages(ctx, cards);
  } catch (error) {
    if (error instanceof TokenNotFoundError) {
      await ctx.reply('It looks like your Gemini token is missing. Please add it by using the command: /addToken <your_gemini_token>');
    } else {
      await ctx.reply('Something went wrong, please try again.');
    }
  }
}

async function getFileTelegramLink(fileId: string) {
  const telegram = new Telegram(process.env.BOT_TOKEN as string);
  const fileLink = await telegram.getFileLink(fileId);

  return fileLink
}

async function getSaveDestinationPath(fileName: string) {
  const now = Date.now();
  const destinationDir = path.join(process.cwd(), 'src', 'tmp');
  const destinationPath = path.join(destinationDir, `${now}_${fileName}`);

  await fs.promises.mkdir(destinationDir, { recursive: true });

  return destinationPath
}

async function saveFileLocally(document: Document): Promise<string> {
  const fileTelegramLink = await getFileTelegramLink(document.file_id)
  const saveDestination = await getSaveDestinationPath(document.file_name!)
  await downloadFile(fileTelegramLink, saveDestination)

  return saveDestination
}

async function downloadFile(fileUrl: URL, destinationPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destinationPath);

    get(fileUrl, (response) => {
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to get '${fileUrl}': ${response.statusCode}`));
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log('File written successfully!');
        resolve();
      });

      file.on('error', (err: Error) => {
        console.error('Error writing file:', err);
        reject(err);
      });
    }).on('error', (err) => {
      console.error('Error downloading file:', err);
      reject(err);
    });
  });
}
