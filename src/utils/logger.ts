import { BotConfig } from "../types/interface";

export class Logger {
  protected config:BotConfig;

  constructor(config: BotConfig) {
    this.config = config
  }

  public async info(message: string) {
    console.log(`[${this.config.platform} BOT - ${this.config.alias}] : ${message}`)
  }

  public async warn(message: string) {
    console.warn(`[${this.config.platform} BOT - ${this.config.alias}] : ${message}`)
  }

  public async error(error: Error) {
    console.error(`[${this.config.platform} BOT - ${this.config.alias}] : ${error.message}`)
  }

}
