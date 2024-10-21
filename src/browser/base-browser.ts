import { Browser, BrowserContext, Page } from "playwright";
import { AccountSettings, BotConfig, Proxy } from "../types/interface";
import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import RecaptchaPlugin from "puppeteer-extra-plugin-recaptcha";
import { Logger } from "../utils/logger";
import { BotError } from "../bot/base-bot";

export abstract class BaseBrowser {
  protected browser!: Browser;
  protected context!: BrowserContext;
  protected page!: Page
  protected config: BotConfig;
  protected logger: Logger;
  protected proxy!: Proxy;
  protected headers!: {
    [key: string]: string;
  };

  constructor(config: BotConfig, logger: Logger) {
    this.config = config
    this.logger = logger;
    this.headers = {}
  }

  async init(proxy: Proxy): Promise<void> {
    chromium.use(RecaptchaPlugin({ provider: { id: "2captcha", token: this.config.captcha_key }, visualFeedback: true, throwOnError: true }));
    chromium.use(StealthPlugin());
    this.proxy = proxy;
    this.browser = await chromium.launch({ headless: !this.config.debug, proxy });
    this.context = await this.browser.newContext({ serviceWorkers: "block" });
    this.page = await this.context.newPage();
    await this.setFilter();
    this.logger.info("init browser success");
  }

  private async setFilter() {
    await this.context.route(/(\.png(\?.*)?$)|(\.jpg(\?.*)?$)|(\.webp(\?.*)?$)|(\.jpeg(\?.*)?$)/, route => route.abort())
    await this.context.route(/https:\/\/www\.google-analytics\.com\/.*/, route => route.abort());
  }

  public async checkProxy(): Promise<void> {
    try {
      await this.page.goto("https://www.google.com", { waitUntil: "domcontentloaded" });
    } catch (error: any) {
      throw new BotError("invalid proxy", {
        where: 'BaseBrowser::checkProxy',
        error: error.message,
        stack: error.stack,
      })
    }
  }

  public abstract home(): Promise<void>;

  public async afterHome(): Promise<void> {
    return Promise.resolve();
  };

  public abstract login(setting: AccountSettings): Promise<void>;

  public async afterLogin(): Promise<void> {
    return Promise.resolve();
  }

}