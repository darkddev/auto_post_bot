import { FanslyBrowser } from '../browser/fansly-browser';
import { FanslyService } from '../services/fansly-service';
import { BotConfig } from '../types/interface';
import { BaseBot, BotError } from './base-bot';

export class FanslyBot extends BaseBot {
  protected browser!: FanslyBrowser;
  protected service!: FanslyService;

  constructor(config: BotConfig) {
    super(config)
  }

  protected async initBrowser(): Promise<void> {
    this.browser = new FanslyBrowser(this.config, this.logger)
    await super.initBrowser();
  }

  protected async initService(): Promise<void> {
    this.service = new FanslyService(this.config, this.logger)
    await super.initService();
  }

  protected async initAccount(): Promise<void> {
    await super.initAccount();
    // check account proxy
    const proxy = this.parseProxy(this.settings.proxy || "cb3ac8e713:zxHGsQ21@163.5.199.154:4444")
    if (!proxy) {
      throw new BotError("no proxy", {
        where: "FanslyBot::initAccount",
        error: "there is no proxy for the account"
      });
    }
    this.proxy = proxy;
    // check device id
    this.settings.device = "703203352300761088";
    if (!this.settings.device) {
      throw new BotError("no device id", {
        where: "FanslyBot::initAccount",
        error: "there is no device id for the account"
      })
    }
    this.logger.info("init account success");
  }

  protected async doPost(): Promise<void> {
    const { contents, postContentIndex, postCount } = this.settings.params;
    let postIndex = postContentIndex || 0;
    if (postIndex >= contents.length)
      postIndex = 0;
    try {
      // prepare posting parameters
      const { image, folder, title, tags, uuid } = contents[postIndex];
      // if needs, delete articles
      let articleCount = postCount || 3;
      const { posts } = await this.browser.getPosts();
      while (posts.length >= articleCount) {
        const post = posts.pop();
        await this.browser.deletePost(post.id);
      }
      // check album and media
      const { albums } = await this.browser.getAlbums();
      let album = albums.find(el => el.title === folder);
      if (!album) {
        album = await this.browser.createAlbum(folder);
        if (!album)
          throw new BotError("cannot create album", {
            where: "FanslyBot::doPost"
          });
        await this.service.createHistory(`create album(${folder})`);
      }

      const { media } = await this.browser.getAlbumMedia(album.id);
      let mediaId;
      if (uuid && media.find(el => el.id === uuid)) {
        mediaId = uuid;
      }
      if (!mediaId) {
        const path = await this.downloadFile(image);
        this.logger.info(`download media(${path})`);
        mediaId = await this.browser.uploadContent(folder, path);
        this.logger.info(`upload media(${mediaId})`);
        if (!mediaId)
          throw new BotError("cannot upload media");
        await this.service.updateContentMedia(postIndex, mediaId);
        await this.service.createHistory(`upload ${postIndex + 1}st media`);
      }
      await this.browser.createPost(title, tags, mediaId);
      this.logger.info(`create ${postIndex + 1}st post(${title})`);
      await this.service.updatePostSetting(postIndex);
      await this.service.createHistory(`create ${postIndex + 1}st post`);
    } catch (error: any) {
      this.logger.warn(`create ${postIndex + 1}st post failed`);
      this.logger.error(error);
      await this.service.createHistory(`create ${postIndex + 1}st post`);
    }
  }
}