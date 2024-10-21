import { BotError } from "../bot/base-bot";
import { ApiError } from "../services/base-service";
import { BotConfig } from "../types/interface";

export class Logger {
  protected config: BotConfig;

  constructor(config: BotConfig) {
    this.config = config
  }

  public async info(message: string) {
    if (this.config.console_log) {
      console.log(`[${this.config.platform} BOT - ${this.config.alias}] : ${message}`)
    }
  }

  public async warn(message: string) {
    if (this.config.console_log) {
      console.warn(`[${this.config.platform} BOT - ${this.config.alias}] : ${message}`)
    }
  }

  public async error(error: Error) {
    if (this.config.console_log) {
      if (error instanceof BotError) {
        console.error(`[${this.config.platform} BOT - ${this.config.alias}] : [BotError - ${error.reason.function}] : ${error.message}`);
      } else if (error instanceof ApiError) {
        console.error(`[${this.config.platform} BOT - ${this.config.alias}] : [ApiError - ${error.path}] : ${error.message}`)
      } else {
        console.error(`[${this.config.platform} BOT - ${this.config.alias}] : [InternalError] : ${error.message}`)
      }
    }
  }
}
