import { Browser, BrowserType, BrowserContext,  Page } from "playwright";
import { BotConfig } from "../types/interface";
import { Logger } from "../utils/logger";
import { BaseBrowser } from "../browser/base-browser";
import { BaseApiService } from "../services/base-service";

export abstract class BaseBot {
  protected abstract browser: BaseBrowser;
  protected abstract service: BaseApiService;

  protected config!:BotConfig
  protected logger!:Logger

  constructor(config:BotConfig) {
    this.config = config
  }

  async init(): Promise<boolean> {
    if (!await this.initLogger())
      return false
    if (!await this.initAccount())
      return false
    if (!await this.initBrowser())
      return false;
    return true
  }

  protected abstract initBrowser():Promise<boolean>;

  async start(): Promise<void> {
    setTimeout(this.schedule.bind(this), this.config.schedule_interval);
  }

  private async initLogger(): Promise<boolean> {
    this.logger = new Logger(this.config)
    this.logger.info("init logger success");
    return true
  }

  private async initAccount():Promise<boolean> {
    this.logger.info("init account success");
    return true;
  }

  async schedule(): Promise<void> {
    console.log("[BOT] : scheduling...")
    setTimeout(this.schedule.bind(this), this.config.schedule_interval);
  }


}