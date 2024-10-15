import { FanslyBrowser } from '../browser/fansly-browser';
import { FanslyService } from '../services/fansly-service';
import { BotConfig, Proxy } from '../types/interface';
import { BaseBot } from './base-bot';

export class FanslyBot extends BaseBot {
  protected browser!: FanslyBrowser;
  protected service!: FanslyService;

  constructor(config: BotConfig) {
    super(config)
  }

  protected async initBrowser(): Promise<boolean> {
    this.browser = new FanslyBrowser(this.config, this.logger)
    return await super.initBrowser();
  }

  protected async initService(): Promise<boolean> {
    this.service = new FanslyService(this.config, this.logger)
    return await super.initService();
  }

  protected async initAccount(): Promise<boolean> {
    if (!await super.initAccount()) {
      return false;
    }
    // check account proxy
    const proxy = this.parseProxy(this.settings.proxy || "cb3ac8e713:zxHGsQ21@163.5.199.156:4444")
    if (!proxy) {
      this.logger.warn("get proxy failed");
      return false;
    }
    this.proxy = proxy;
    this.logger.info("init account success");
    return true
  }

}