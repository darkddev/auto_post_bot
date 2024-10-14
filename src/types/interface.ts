export interface BotConfig {
  platform: string,
  alias: string,
  schedule_interval: number,
  graylog_host: string,
  captcha_key: string,
  server_root: string,
}