import { AccountSettings, BotConfig, Proxy } from "../types/interface";
import { Logger } from "../utils/logger";
import { BaseBrowser } from "../browser/base-browser";
import { BaseApiService } from "../services/base-service";

export class BotError extends Error {
  public reason: any;
  constructor(message: string, reason : any = undefined) {
    super(message); // Call the parent constructor with the message
    this.name = "BotError"; // Set the error name
    this.reason = reason;
  }
}

export abstract class BaseBot {
  protected abstract browser: BaseBrowser;
  protected abstract service: BaseApiService;
  protected config!: BotConfig;
  protected logger!: Logger;
  protected settings!: AccountSettings;
  protected proxy!: Proxy;
  constructor(config: BotConfig) {
    this.config = config
  }

  async init(): Promise<boolean> {
    if (!await this.initLogger() || !await this.initService() || !await this.initAccount() || !await this.initBrowser())
      return false;
    return true;
  }

  protected async initBrowser(): Promise<boolean> {
    return await this.browser.init(this.proxy);
  }

  protected async initService(): Promise<boolean> {
    return await this.service.init();
  }
  
  protected async initAccount(): Promise<boolean> {
    if (!await this.getAccount()) {
      this.logger.warn("get account failed");
      return false;
    }
    return true;
  };

  async start(): Promise<void> {
    try {
      // open home page
      await this.browser.home()
      await this.browser.afterHome();
      await this.browser.login(this.settings.email, this.settings.password)
      await this.browser.afterLogin();

    } catch(error:any) {

    }
  }

  private async initLogger(): Promise<boolean> {
    this.logger = new Logger(this.config)
    this.logger.info("init logger success");
    return true
  }

  protected async getAccount(): Promise<boolean> {
    const settings = await this.service.getAccountSettings();
    if (settings) {
      this.settings = settings;
      return true;
    }
    return false;
  }

  async schedule(): Promise<void> {
    console.log("[BOT] : scheduling...")
    setTimeout(this.schedule.bind(this), this.config.schedule_interval);
  }

  protected parseProxy(proxy: String): Proxy | undefined {
    const [account, addr] = proxy.trim().split("@");
    if (!account || !addr)
      return undefined
    const [username, password] = account.split(":");
    if (!username || !password)
      return undefined
    return ({
      server: `http://${addr}`,
      username,
      password,
    })
  }
}