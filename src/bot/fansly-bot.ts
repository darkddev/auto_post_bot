import { BaseBrowser } from '../browser/base-browser';
import { FanslyBrowser } from '../browser/fansly-browser';
import { BaseApiService } from '../services/base-service';
import { FanslyService } from '../services/fansly-service';
import { BotConfig } from '../types/interface';
import { BaseBot } from './base-bot';

export class FanslyBot extends BaseBot {
  protected browser!: FanslyBrowser;
  protected service!: FanslyService;

  constructor(config: BotConfig) {
    super(config)
  }

  protected async initBrowser():Promise<boolean> {
    this.browser = new FanslyBrowser(this.config, this.logger)
    return await this.browser.init();
  }

  protected async initService():Promise<boolean> {
    this.service = new FanslyService(this.config, this.logger)
    return await this.service.init();
  }
}