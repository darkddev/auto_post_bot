import { Browser, BrowserContext, Page } from "playwright";
import { BotConfig, Proxy } from "../types/interface";
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

  async init(proxy: Proxy | undefined): Promise<boolean> {
    chromium.use(RecaptchaPlugin({ provider: { id: "2captcha", token: this.config.captcha_key }, visualFeedback: true, throwOnError: true }));
    chromium.use(StealthPlugin());
    this.browser = await chromium.launch({ headless: !this.config.debug, proxy });
    this.context = await this.browser.newContext({serviceWorkers: "block"});
    this.page = await this.context.newPage();
    await this.setFilter();
    if (!await this.checkProxy()) {
      this.logger.warn("invalid proxy");
      return false;
    }
    this.logger.info("init browser success");
    return true
  }

  private async setFilter() {
    // await this.context.route("**/*.{png,jpg,jpeg,webp}", route => route.abort());
    // await this.context.route(/https:\/\/fansly\.com\/assets\/images\/.*/, route => route.abort());
    // await this.context.route(/https:\/\/www\.google-analytics\.com\/.*/, route => route.abort());
    // await this.page.route("**/*.{png,jpg,jpeg,webp}", route => route.abort());
    // await this.page.route(/https:\/\/www\.google-analytics\.com\/.*/, route => route.abort());
    // await this.page.route(/https:\/\/fansly\.com\/assets\/images\/.*/, route => route.abort());
    const blockedResTypes = ["image", "media", "manifest"];
    const blockedUrls = [/https:\/\/www\.google-analytics\.com\/.*/, /https:\/\/fansly\.com\/assets\/images\/.*/];
    const blockedExts = [/\.png(\?.*)?$/i, /\.jpg(\?.*)?$/i, /\.webp(\?.*)?$/i, /\.jpeg(\?.*)?$/i]
    await this.page.route("**/*", route => {
      const req = route.request();
      const url = req.url();
      if (blockedUrls.some(regex => regex.test(url)) || blockedExts.some(regex => regex.test(url))) {
        route.abort();
      } else {
        route.continue();
      }
    });
  }

  private async checkProxy(): Promise<boolean> {
    try {
      await this.page.goto("https://www.google.com", { waitUntil: "domcontentloaded" });
      return true;
    } catch (error: any) {
      this.logger.error(error);
      return false;
    }
  }

  public abstract home(): Promise<void>;
  
  public async afterHome(): Promise<void> {
    return Promise.resolve();
  };

  public abstract login(email: string, password: string): Promise<void>;

  public async afterLogin(): Promise<void> {
    return Promise.resolve();
  }

}