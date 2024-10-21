import dotenv from 'dotenv';
import { program } from 'commander';
import { Platform } from "./types/constant";
import { BaseBot } from "./bot/base-bot";
import { FanslyBot } from "./bot/fansly-bot";
import { BotConfig } from './types/interface';
dotenv.config();

program.option('-d, --debug').option('-f, --force');
program.parse();

if (program.args.length < 2) {
  console.log("[BOT] : invalid command");
  process.exit();
}

let config: BotConfig = {
  platform: program.args[0],
  alias: program.args[1],
  schedule_interval: parseInt(process.env.SCHEDULE_INTERVAL || "30000"),
  graylog_host: process.env.GRAYLOG_HOST,
  captcha_key: process.env.CAPTCHA_KEY || "",
  server_root: process.env.SERVER_ROOT || "http://localhost:5000",
  console_log: process.env.CONSOLE_LOG == "true",
  debug: false,
  force: true,
};


(async () => {
  let bot: BaseBot
  switch (config.platform) {
    case Platform.FANSLY:
      bot = new FanslyBot(config)
      break
    default:
      console.log("[BOT] : platform not found");
      process.exit()
  }
  await bot.init()
  await bot.start();
})();