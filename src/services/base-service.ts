import axios from "axios";
import { AccountSettings, BotConfig } from "../types/interface";
import { Logger } from "../utils/logger";

export class ApiError extends Error {
  public path: string;
  constructor(message: string, path: string) {
    super(message); // Call the parent constructor with the message
    this.name = "ApiError"; // Set the error name
    this.path = path
  }
}

export abstract class BaseApiService {
  protected config: BotConfig;
  protected logger: Logger;
  protected token!: string;

  protected constructor(config: BotConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  public async init(): Promise<boolean> {
    try {
      const { token } = await this.postRequest(
        `/platform/${this.config.platform}`,
        { alias: Buffer.from(this.config.alias).toString('base64') }
      );
      this.token = token;
      await this.logger.info("init service success");
      return true;
    } catch (error: any) {
      await this.logger.error(error);
      await this.logger.warn("init service failed");
      return false;
    }
  }

  public async getAccountSettings(): Promise<AccountSettings | undefined> {
    try {
      const { account } = await this.getRequest(`/account`);
      return account;
    } catch (error: any) {
      await this.logger.error(error);
      return undefined;
    }
  }

  protected async getRequest(path: string, params: any = undefined) {
    try {
      const resp = await axios.get(
        `${this.config.server_root}/bot${path}`,
        {
          headers: this.token ? { "Authorization": `Bearer ${this.token}` } : {},
          params
        });
      const { success, message, payload } = resp.data;
      if (!success)
        throw new ApiError(message, path);
      return payload;
    } catch (error: any) {
      console.error(error)
      if (error instanceof ApiError) {
        throw error;
      } else if (error.response?.status === 401) {
        throw new ApiError("permission denied", path);
      } else if (error.response?.status === 404) {
        throw new ApiError("invalid api", path);
      } else {
        throw new ApiError("server connection failed", path);
      }
    }
  }

  protected async putRequest(path: string, data: any = undefined, params: any = undefined) {
    try {
      const resp = await axios.put(
        `${this.config.server_root}/bot${path}`,
        data,
        {
          headers: this.token ? { "Authorization": `Bearer ${this.token}` } : {},
          params
        });
      const { success, message, payload } = resp.data;
      if (!success)
        throw new ApiError(message, path);
      return payload;
    } catch (error: any) {
      console.error(error)
      if (error instanceof ApiError) {
        throw error;
      } else if (error.response?.status === 401) {
        throw new ApiError("permission denied", path);
      } else if (error.response?.status === 404) {
        throw new ApiError("invalid api", path);
      } else {
        throw new ApiError("server connection failed", path);
      }
    }
  }
  protected async postRequest(path: string, data: any = undefined, params: any = undefined) {
    try {
      const resp = await axios.post(
        `${this.config.server_root}/bot${path}`,
        data,
        {
          headers: this.token ? { "Authorization": `Bearer ${this.token}` } : {},
          params
        });
      const { success, message, payload } = resp.data;
      if (!success)
        throw new ApiError(message, path);
      return payload;
    } catch (error: any) {
      console.error(error)
      if (error instanceof ApiError) {
        throw error;
      } else if (error.response?.status === 401) {
        throw new ApiError("permission denied", path);
      } else if (error.response?.status === 404) {
        throw new ApiError("invalid api", path);
      } else {
        throw new ApiError("server connection failed", path);
      }
    }
  }

  protected async deleteRequest(path: string, data: any = undefined, params: any = undefined) {
    try {
      const resp = await axios.delete(
        `${this.config.server_root}/bot${path}`,
        {
          headers: this.token ? { "Authorization": `Bearer ${this.token}` } : {},
          data,
          params
        });
      const { success, message, payload } = resp.data;
      if (!success)
        throw new ApiError(message, path);
      return payload;
    } catch (error: any) {
      console.error(error)
      if (error instanceof ApiError) {
        throw error;
      } else if (error.response?.status === 401) {
        throw new ApiError("permission denied", path);
      } else if (error.response?.status === 404) {
        throw new ApiError("invalid api", path);
      } else {
        throw new ApiError("server connection failed", path);
      }
    }
  }

}

