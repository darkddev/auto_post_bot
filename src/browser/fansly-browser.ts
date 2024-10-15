import { BotError } from "../bot/base-bot";
import { FanslyService } from "../services/fansly-service";
import { BotConfig } from "../types/interface";
import { Logger } from "../utils/logger";
import { BaseBrowser } from "./base-browser";

export class FanslyBrowser extends BaseBrowser {

  protected service!: FanslyService
  constructor(config: BotConfig, logger: Logger) {
    super(config, logger)
  }

  public async home(): Promise<void> {
    try {
      await this.page.goto("https://fansly.com", { waitUntil: "load" });
      this.logger.info("open home page");
    } catch (error: any) {
      throw new BotError("proxy blocked", {
        function: "FanslyBrowser::home",
        error: error,
        path: "https://fansly.com",
      });
    }
  }

  public async afterHome(): Promise<void> {
    try {
      await this.page.waitForSelector("app-age-gate-modal", { timeout: 30000 });
      await this.page.locator("app-age-gate-modal .button-wrapper > .solid-green").first().click();
      this.logger.info("close age gate modal");
    } catch (error) {
    }
  }

  public async login(email: string, password: string): Promise<void> {
    try {
      // install login api hook
      await this.page.route("https://apiv3.fansly.com/api/v1/login?ngsw-bypass=true", (route, request) => {
        if (request.method() == "POST") {
          const oldPostData = request.postDataJSON();
          route.continue({ postData: { ...oldPostData, deviceId: "697497185943564288" } });
        } else {
          route.continue();
        }
      });
      // input login credentail
      await this.page.locator("input[name='username']").first().fill(email);
      await this.page.locator("input[name='password']").first().fill(password);
      // prepare wait reponse
      const loginResponse = this.page.waitForResponse(response => 
        response.url() === "https://apiv3.fansly.com/api/v1/login?ngsw-bypass=true" && response.request().method() === "POST"
      );
      // click login button
      await this.page.locator(".login-form > app-button").first().click();
      // check login api response
      const resp1 = await loginResponse;
      const body = await resp1.body();
      const respData1 = await resp1.json();
      if (!respData1.success) {
        throw new BotError("invalid credentail", {
          path: "https://apiv3.fansly.com/api/v1/login?ngsw-bypass=true",
          response: respData1,
          function: "FanslyBrowser::login"
        });
      }
      if (respData1.response && respData1.response.twofa) {
        throw new BotError("invalid device id", {
          path: "https://apiv3.fansly.com/api/v1/login?ngsw-bypass=true",
          response: respData1,
          function: "FanslyBrowser::login"
        });
      }
      this.logger.info("login success");
    } catch (error: any) {
      if (error instanceof BotError) {
        throw error;
      } else if (error.message.includes("Protocol error (Network.getResponseBody)")) {
        this.logger.info("login success");
        return;
      } else {
        throw new BotError("login failed due to internal error", {
          function: "FanslyBrowser::login",
          error: error,
        });
      }
    }
  }

  public async afterLogin(): Promise<void> {
    try {
      await this.page.waitForSelector("app-web-push-enable-modal", { timeout: 30000 });
      await this.page.locator("app-web-push-enable-modal .btn").first().click();
      this.logger.info("close push enable modal");
    } catch (error) {
      console.error(error);
    }
  }
}