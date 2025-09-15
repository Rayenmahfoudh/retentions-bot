import { Context } from "telegraf";

export async function startCommand(ctx: Context) {
  await ctx.reply(
    "Welcome! I'm your retention bot. I help you review your notes using a retention algorithm that quizzes you at random times.\n\nIf you need assistance, just type /help."
  );
}

