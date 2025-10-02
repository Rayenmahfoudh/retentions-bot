import { getUserId } from "@core/store";
import { updateUserGeminiToken } from "@services/UserService";
import { Context } from "telegraf";

export async function startCommand(ctx: Context) {
  await ctx.reply(
    "Welcome! I'm your retention bot. I help you review your notes using a retention algorithm that quizzes you at random times.\n\nIf you need assistance, just type /help."
  );
}

export async function helpCommand(ctx: Context) {
  await ctx.reply(
    `Available commands:

- **addCard question::answer::deckName**: Adds a flashcard with the specified question, answer, and deck name.

- **Send a .md file with the caption as the deck name**: Upload a markdown file to generate flashcards automatically using AI.

- **/addToken GEMINI_TOKEN**: Adds your Gemini token for authentication.`
  );
}

export async function addTokenCommand(ctx: Context) {
  try {
    const command = ctx.message!.text;
    const token = command.replace(/\/addtoken\s*/i, "");

    if (!token || token == null) {
      ctx.reply("Please provide a valid gemini token")
      return
    }
    const userId = getUserId()

    await updateUserGeminiToken(token, userId)


    ctx.reply("Token updated successfully")
    return

  } catch (error) {
    console.error(error)
    ctx.reply("Internal Server error")
    return
  }
}

