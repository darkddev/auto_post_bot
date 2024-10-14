import { Browser, BrowserContext, Page } from "playwright";
import { BotConfig } from "../types/interface";
import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import RecaptchaPlugin from "puppeteer-extra-plugin-recaptcha";
import { Logger } from "../utils/logger";

export abstract class BaseBrowser {
  protected browser!: Browser;
  protected context!: BrowserContext;
  protected page!: Page
  protected config: BotConfig;
  protected logger: Logger;

  constructor(config: BotConfig, logger: Logger) {
    this.config = config
    this.logger = logger;
  }

  async init():Promise<boolean> {
    chromium.use(RecaptchaPlugin({ provider: { id: "2captcha", token: this.config.captcha_key }, visualFeedback: true, throwOnError: true }));
    chromium.use(StealthPlugin());
    this.browser = await chromium.launch({headless: false});
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
    if (!await this.checkProxy()) {
      this.logger.warn("init browser failed");
      return false;
    }
    this.logger.info("init browser success");
    return true
  }

  private async checkProxy():Promise<boolean> {
    try {
      this.page.goto("https://www.google.com", {waitUntil:"domcontentloaded"});
      return true;
    } catch (error:any) {
      this.logger.error(error);
      return false;
    }
  }
}