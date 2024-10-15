export interface BotConfig {
  platform: string,
  alias: string,
  schedule_interval: number,
  graylog_host: string,
  captcha_key: string,
  server_root: string,
  debug: boolean,
  force: boolean,
}

export interface AccountSettings {
  email: string,
  password: string,
  status: boolean,
  proxy: string,
  params: any
}

export interface Proxy {
  server: string,
  username: string,
  password: string,
}