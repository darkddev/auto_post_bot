import { AccountSettings, BotConfig, Proxy } from "../types/interface";
import { Logger } from "../utils/logger";
import { BaseBrowser } from "../browser/base-browser";
import { BaseApiService } from "../services/base-service";
import fs from 'fs';
import os from 'os';
import path from 'path';
import http from 'http';
import moment from 'moment';

export class BotError extends Error {
  public reason: any;
  constructor(message: string, reason: any = undefined) {
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

  async init(): Promise<void> {
    try {
      await this.initLogger();
      await this.initService();
      await this.initAccount();
      await this.initBrowser();
      await this.initProxy();
      await this.service.createHistory("bot started");
    } catch (error: any) {
      if (this.logger)
        this.logger.warn(`bot closed due to ${error instanceof BotError ? error.message : 'internal error'}`);
      if (this.service)
        await this.service.createHistory(`bot closed due to ${error instanceof BotError ? error.message : 'internal error'}`);
      throw error;
    }
  }

  private async initLogger(): Promise<void> {
    this.logger = new Logger(this.config)
    this.logger.info("init logger success");
  }

  protected async initBrowser(): Promise<void> {
    await this.browser.init(this.proxy);
  }

  protected async initService(): Promise<void> {
    await this.service.init();
  }

  protected async initAccount(): Promise<void> {
    await this.getAccount();
  };

  protected async initProxy(): Promise<void> {
    try {
      await this.browser.checkProxy();
      await this.browser.home();
      await this.logger.info(`select proxy(${this.proxy.server})`)
    } catch (error) {
      await this.logger.warn(`invalid proxy(${this.proxy.server})`)
      await this.service.blockProxy();
      throw error;
    }
  }

  async start(): Promise<void> {
    try {
      // open home page
      // await this.browser.home()
      await this.browser.afterHome();
      await this.service.createHistory("open home page");
      await this.browser.login(this.settings);
      await this.browser.afterLogin();
      await this.service.createHistory("login success");
      setTimeout(this.schedule.bind(this), 100);
    } catch (error: any) {
      if (this.logger)
        this.logger.warn(`bot closed due to ${error instanceof BotError ? error.message : 'internal error'}`);
      if (this.service)
        await this.service.createHistory(`bot closed due to ${error instanceof BotError ? error.message : 'internal error'}`);
      throw error;
    }
  }

  protected async getAccount(): Promise<void> {
    const settings = await this.service.getAccountSettings();
    this.settings = settings;
  }

  protected needUpdate(): boolean {
    return !this.settings.params || !this.settings.params.recent;
  }

  protected needPost(): boolean {
    const { postNextTime } = this.settings.params;
    if (!postNextTime)
      return true;
    return moment().isAfter(moment(postNextTime));
  }

  protected async doUpdate(): Promise<void> {
    const count = await this.service.updateContents();
    this.logger.info(`update ${count} contents`);
    await this.service.createHistory(`update ${count} contents`);
  }

  protected async doPost(): Promise<void> {
    return Promise.resolve();
  }

  // bot schedule function
  async schedule(): Promise<void> {
    try {
      // get account from server
      await this.getAccount();
      // if account is disabled and not in force mode, close bot
      if (!this.config.force && !this.settings.status)
        throw new BotError("account disabled", {
          where: "BaseBot::schedule",
          account: this.settings
        });

      if (this.needUpdate()) { // check if needs to update contents
        await this.doUpdate();
      } else if (this.needPost()) { // check if needs to post
        await this.doPost();
      }
    } catch (error: any) {
      this.logger.error(error);
      throw error;
    }
    setTimeout(this.schedule.bind(this), this.config.schedule_interval);
  }

  protected async downloadFile(file: string): Promise<string> {
    const url = `${this.config.server_root}/uploads/${file}`;
    const filepath = path.join(os.tmpdir(), file);
    return new Promise((resolve, reject) => {
      let file = fs.createWriteStream(filepath);
      http.get(url, response => {
        response.pipe(file);
        file.on('finish', () => {
          file.close(() => resolve(filepath));
        })
      }).on('error', err => {
        fs.unlinkSync(filepath);
        reject(err);
      })
    })
  }

  protected async retryAction(action: any, ...params: any[]) {
    let attempt = 0;
    while (attempt < 3) {
      try {
        await action(...params)
        return
      } catch (err) {
        attempt++;
        if (attempt >= 3) {
          throw err;
        }
      }
    }
  }

  // parse proxy string to proxy interface
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