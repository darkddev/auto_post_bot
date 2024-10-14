import axios from "axios";
import { BotConfig } from "../types/interface";
import { Logger } from "../utils/logger";

class ApiError extends Error {
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

  public async init():Promise<boolean> {
    try {
      // const { token } = await this.postRequest("/account", { platform: this.config.platform, alias: this.config.alias });
      // this.token = token;
      return true;
    } catch (error: any) {
      await this.logger.error(error);
      return false;
    }
  }

  protected async getRequest(path: string, params: any = undefined) {
    try {
      const resp = await axios.get(
        `${this.config.server_root}/bot/${path}`,
        {
          headers: this.token ? { "Authorization": `Bearer ${this.token}` } : {},
          params
        });
      return resp.data
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new ApiError("permission denied", path)
      } else {
        throw new ApiError("server connection failed", path)
      }
    }
  }

  protected async putRequest(path: string, data: any = undefined, params: any = undefined) {
    try {
      const resp = await axios.put(
        `${this.config.server_root}/bot/${path}`,
        data,
        {
          headers: this.token ? { "Authorization": `Bearer ${this.token}` } : {},
          params
        });
      return resp.data
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new ApiError("permission denied", path)
      } else {
        throw new ApiError("server connection failed", path)
      }
    }
  }
  protected async postRequest(path: string, data: any = undefined, params: any = undefined) {
    try {
      const resp = await axios.post(
        `${this.config.server_root}/bot/${path}`,
        data,
        {
          headers: this.token ? { "Authorization": `Bearer ${this.token}` } : {},
          params
        });
      return resp.data
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new ApiError("permission denied", path)
      } else {
        throw new ApiError("server connection failed", path)
      }
    }
  }

  protected async deleteRequest(path: string, data: any = undefined, params: any = undefined) {
    try {
      const resp = await axios.delete(
        `${this.config.server_root}/bot/${path}`,
        {
          headers: this.token ? { "Authorization": `Bearer ${this.token}` } : {},
          data,
          params
        });
      return resp.data
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new ApiError("permission denied", path)
      } else {
        throw new ApiError("server connection failed", path)
      }
    }
  }

}

