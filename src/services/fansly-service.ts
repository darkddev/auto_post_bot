import { BotConfig } from "../types/interface";
import { Logger } from "../utils/logger";
import { BaseApiService } from "./base-service";

export class FanslyService extends BaseApiService {

  constructor(config:BotConfig, logger: Logger) {
      super(config, logger)
  }
}

