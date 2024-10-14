import { FanslyService } from "../services/fansly-service";
import { BotConfig } from "../types/interface";
import { Logger } from "../utils/logger";
import { BaseBrowser } from "./base-browser";

export class FanslyBrowser extends BaseBrowser {
  protected service!:FanslyService
  constructor(config:BotConfig, logger: Logger) {
    super(config, logger)
  }

}