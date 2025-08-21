import { Context, Telegraf } from "telegraf";

export async function startCommand(ctx: Context) {
  await ctx.reply(
    "Welcome! I'm your retention bot. I help you review your notes using a retention algorithm that quizzes you at random times. How can I assist you today?"
  );
}
