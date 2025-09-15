import { Context } from "telegraf";

export async function helpCommand(ctx: Context) {
  await ctx.reply("This is the help command")
}
