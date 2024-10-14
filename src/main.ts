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
const platform = program.args[0];
const alias = program.args[1];

let config:BotConfig = {
  platform: program.args[0],
  alias: program.args[1],
  schedule_interval: parseInt(process.env.SCHEDULE_INTERVAL || "30000"),
  graylog_host: process.env.GRAYLOG_HOST || "100.115.196.30",
  captcha_key: process.env.CAPTCHA_KEY || "",
  server_root: process.env.SERVER_ROOT || "http://localhost:5000",
};

(async () => {
  let bot: BaseBot
  switch(platform) {
    case Platform.FANSLY:
      bot = new FanslyBot(config)
      break
    default:
      console.log("[BOT] : platform not found");
      process.exit()
  }
  if (!await bot.init()) {
    console.log("[BOT] : initialization failed");
    process.exit();
  }
  await bot.start();
})();