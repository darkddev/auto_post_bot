import { BotError } from "../bot/base-bot";
import { FanslyService } from "../services/fansly-service";
import { AccountSettings, BotConfig, FanslyAlbumMediaResponse, FanslyAlbumResponse } from "../types/interface";
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
        where: "FanslyBrowser::home",
        error: error.message,
        stack: error.stack,
        url: "https://fansly.com",
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

  public async login(setting: AccountSettings): Promise<void> {
    try {
      await this.page.waitForTimeout(1000);
      // install login api hook
      await this.page.unroute("https://apiv3.fansly.com/api/v1/login?ngsw-bypass=true");
      // // await this.page.route("https://apiv3.fansly.com/api/v1/login?ngsw-bypass=true", route =>route.continue());
      await this.page.route("https://apiv3.fansly.com/api/v1/login?ngsw-bypass=true", route => {
        const request = route.request();
        const oldPostData = request.postDataJSON();
        route.continue({ postData: { ...oldPostData, deviceId: setting.device } });
      });
      // input login credentail
      await this.page.locator("input[name='username']").first().fill(setting.email);
      await this.page.locator("input[name='password']").first().fill(setting.password);
      await this.page.waitForTimeout(1000);
      // prepare wait reponse
      const loginResponse = this.page.waitForResponse(response => {
        return response.url() === "https://apiv3.fansly.com/api/v1/login?ngsw-bypass=true" && response.request().method() === "POST"
      }, { timeout: 120000 });
      // click login button
      await this.page.locator(".login-form > app-button").first().click();
      // check login api response
      const resp1 = await loginResponse;
      try {
        const respData1 = await resp1.json();
        if (!respData1.success) {
          throw new BotError("invalid credential", {
            where: "FanslyBrowser::login",
            url: "https://apiv3.fansly.com/api/v1/login?ngsw-bypass=true",
            response: respData1,
          });
        }
        if (respData1.response && respData1.response.twofa) {
          throw new BotError("invalid device id", {
            where: "FanslyBrowser::login",
            url: "https://apiv3.fansly.com/api/v1/login?ngsw-bypass=true",
            response: respData1,
          });
        }
      } catch (error) {
      }
      const meResponse = this.page.waitForResponse(response => {
        return response.url() == "https://apiv3.fansly.com/api/v1/account/me?ngsw-bypass=true"
      });
      const resp2 = await meResponse;
      this.headers = await resp2.request().allHeaders();
      this.logger.info("login success");
    } catch (error: any) {
      await this.page.unroute("https://apiv3.fansly.com/api/v1/login?ngsw-bypass=true");
      if (error instanceof BotError) {
        throw error;
      } else {
        throw new BotError("proxy blocked", {
          where: "FanslyBrowser::login",
          error: error.message,
          stack: error.stack,
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

    }
  }

  public async deletePost(postId: string): Promise<void> {
    try {
      const resp = await this.page.request.post(
        `https://apiv3.fansly.com/api/v1/post/${postId}/delete?ngsw-bypass=true`,
        { headers: this.headers });
      const { success } = await resp.json();
      if (!success)
        throw new BotError(`delete post(${postId}) failed`, {
          function: "FanslyBrowser::deletePost",
          response: await resp.json(),
          path: `https://apiv3.fansly.com/api/v1/post/${postId}/delete?ngsw-bypass=true`,
        })
      this.logger.info(`delete post(${postId})`);
    } catch (error) {
      if (error instanceof BotError)
        throw error;
      throw new BotError("delete post failed", {
        function: "FanslyBrowser::deletePost",
        error: error,
        path: `https://apiv3.fansly.com/api/v1/post/${postId}/delete?ngsw-bypass=true`,
      });
    }
  }

  public async getAlbumMedia(albumId: string): Promise<FanslyAlbumMediaResponse> {
    try {
      const headers = this.headers;
      const resp = await this.page.request.get(
        `https://apiv3.fansly.com/api/v1/media/vaultnew?albumId=${albumId}&mediaType=&search=&before=0&after=0&ngsw-bypass=true`,
        { headers: headers });
      const data = await resp.json();
      if (!data.success)
        throw new BotError("get album media failed", {
          function: "FanslyBrowser::getAlbumMedia",
          path: `https://apiv3.fansly.com/api/v1/media/vaultnew?albumId=${albumId}&mediaType=&search=&before=0&after=0&ngsw-bypass=true`,
          response: data,
        });
      return data.response;
    } catch (error: any) {
      if (error instanceof BotError)
        throw error;
      else
        throw new BotError("get album media failed", {
          function: "FanslyBrowser::getAlbumMedia",
          path: `https://apiv3.fansly.com/api/v1/media/vaultnew?albumId=${albumId}&mediaType=&search=&before=0&after=0&ngsw-bypass=true`,
          error: error,
        })
    }
  }

  public async getAlbums(): Promise<FanslyAlbumResponse> {
    try {
      const headers = this.headers;
      const resp = await this.page.request.get(
        "https://apiv3.fansly.com/api/v1/vault/albumsnew?ngsw-bypass=true",
        { headers: headers });
      const data = await resp.json();
      if (!data.success)
        throw new BotError("get albums failed", {
          function: "FanslyBrowser::getAlbums",
          path: "https://apiv3.fansly.com/api/v1/vault/albumsnew?ngsw-bypass=true",
          response: data,
        });
      return data.response;
    } catch (error: any) {
      if (error instanceof BotError)
        throw error;
      else
        throw new BotError("get albums failed", {
          function: "FanslyBrowser::getAlbums",
          path: "https://apiv3.fansly.com/api/v1/vault/albumsnew?ngsw-bypass=true",
          error: error,
        })
    }
  }

  public async deleteAlbumMedia(albumId: string, mediaId: string): Promise<any> {
    try {
      const headers = this.headers;
      const resp = await this.page.request.post(
        "https://apiv3.fansly.com/api/v1/vault/albums/media/delete?ngsw-bypass=true",
        { headers: headers, data: { albumId: albumId, mediaIds: [mediaId] } });
      const data = await resp.json();
      if (!data.success)
        throw new BotError("delete album media failed", {
          function: "FanslyBrowser::deleteAlbumMedia",
          path: "https://apiv3.fansly.com/api/v1/vault/albums/media/delete?ngsw-bypass=true",
          response: data,
        });
      return;
    } catch (error: any) {
      if (error instanceof BotError)
        throw error;
      else
        throw new BotError("delete album media failed", {
          function: "FanslyBrowser::deleteAlbumMedia",
          path: "https://apiv3.fansly.com/api/v1/vault/albums/media/delete?ngsw-bypass=true",
          error: error,
        })
    }
  }

  public async createAlbum(title: string): Promise<any> {
    try {
      const headers = this.headers;
      const resp = await this.page.request.post(
        "https://apiv3.fansly.com/api/v1/vault/albums?ngsw-bypass=true",
        {
          headers: headers,
          data: { id: null, title: title, description: "", accountId: null, type: 0 }
        });
      const data = await resp.json();
      if (!data.success)
        throw new BotError("create album failed", {
          function: "FanslyBrowser::createAlbum",
          path: "https://apiv3.fansly.com/api/v1/vault/albums?ngsw-bypass=true",
          response: data,
        });
      this.logger.info(`create album(${title})`);
      return data;
    } catch (error: any) {
      if (error instanceof BotError)
        throw error;
      else
        throw new BotError("create album failed", {
          function: "FanslyBrowser::createAlbum",
          path: "https://apiv3.fansly.com/api/v1/vault/albums?ngsw-bypass=true",
          error: error,
        })
    }
  }

  public async createPost(title: string, tags: string, mediaId: string): Promise<string> {
    try {
      const headers = this.headers;
      let resp = await this.page.request.post(
        "https://apiv3.fansly.com/api/v1/account/media?ngsw-bypass=true",
        {
          headers: headers,
          data: [{ "mediaId": mediaId, "previewId": null, "permissionFlags": 0, "price": 0, "whitelist": [], "permissions": { "permissionFlags": [] }, "tags": [] }]
        });
      const data1 = await resp.json();
      if (!data1.success)
        throw new BotError("create post failed", {
          function: "FanslyBrowser::createPost",
          path: "https://apiv3.fansly.com/api/v1/account/media?ngsw-bypass=true",
          response: data1,
        });
      const contentId = data1.response[0].id;
      resp = await this.page.request.post(
        "https://apiv3.fansly.com/api/v1/post?ngsw-bypass=true",
        {
          headers: headers,
          data: { "content": `${title}\n\n${tags}`, "fypFlags": 0, "inReplyTo": null, "quotedPostId": null, "attachments": [{ "contentId": contentId, "contentType": 1, "pos": 0 }], "scheduledFor": 0, "expiresAt": 0, "postReplyPermissionFlags": [], "pinned": 0, "wallIds": [] }
        });
      const data2 = await resp.json();
      if (!data2.success)
        throw new BotError("create post failed", {
          function: "FanslyBrowser::createPost",
          path: "https://apiv3.fansly.com/api/v1/post?ngsw-bypass=true",
          response: data2,
        });
      return data2.response.id;
    } catch (error: any) {
      if (error instanceof BotError)
        throw error;
      else
        throw new BotError("create post failed", {
          function: "FanslyBrowser::createPost",
          error: error,
        })
    }
  }

  public async gotoHome(): Promise<void> {
    try {
      await this.page.goto("https://fansly.com/home");
      this.logger.info("go to home page");
    } catch (error: any) {
      throw new BotError("go to home failed", {
        function: "FanslyBrowser::createPost",
        error: error,
      })
    }
  }

  public async uploadContent(folder: string, filepath: string): Promise<any> {
    try {
      await this.page.locator(".default-dropdown").first().click();
      await this.page.waitForTimeout(1000);
      await this.page.locator(".default-dropdown > .dropdown-list > .dropdown-item").last().click();
      await this.page.waitForTimeout(1000);
      await this.page.locator("app-media-vault").getByText(folder).first().click();
      await this.page.waitForTimeout(1000);
      await this.page.locator(".close-toggle").first().click();
      const completeResponse = this.page.waitForResponse("https://apiv3.fansly.com/api/v1/vault/albums/media?ngsw-bypass=true");
      await this.page.locator("app-media-upload-input > input").first().setInputFiles(filepath);
      const resp = await completeResponse;
      const data = await resp.json();
      if (!data.success)
        throw new BotError("upload content failed", {
          function: "FanslyBrowser::uploadContent",
          response: data,
        });
      await this.page.locator("app-media-vault-picker-modal .actions > i").first().click();
      return data.response[0].mediaId;
    } catch (error: any) {
      if (error instanceof BotError)
        throw error;
      else
        throw new BotError("upload content failed", {
          function: "FanslyBrowser::uploadContent",
          error: error,
        })
    }
  }

  public async getPosts(): Promise<any> {
    try {
      const headers = this.headers;
      const resp = await this.page.request.get("https://apiv3.fansly.com/api/v1/timeline/home?before=0&after=0&mode=0&ngsw-bypass=true", {
        headers: headers
      });
      const data = await resp.json();
      if (!data.success)
        throw new BotError("get posts failed", {
          where: "FanslyBrowser::getPosts",
          url: "https://apiv3.fansly.com/api/v1/timeline/home?before=0&after=0&mode=0&ngsw-bypass=true",
          response: data,
        });
      return data.response;
    } catch (error: any) {
      if (error instanceof BotError)
        throw error;
      else
        throw new BotError("get posts failed", {
          where: "FanslyBrowser::getPosts",
          url: "https://apiv3.fansly.com/api/v1/timeline/home?before=0&after=0&mode=0&ngsw-bypass=true",
          error: error.message,
          stack: error.stack,
        })
    }
  }
}