export interface BotConfig {
  platform: string,
  alias: string,
  schedule_interval: number,
  graylog_host: string | undefined,
  captcha_key: string,
  server_root: string,
  console_log: boolean,
  debug: boolean,
  force: boolean,
}

export interface AccountSettings {
  email: string,
  password: string,
  status: boolean,
  proxy: string | undefined,
  device: string | undefined,
  params: any
}

export interface Proxy {
  server: string,
  username: string,
  password: string,
}

export interface FanslyAlbum {
  id: string,
  accountId: string,
  createdAt: number,
  description: string | null,
  itemCount: number,
  lastItemId: string,
  pos: number,
  status: number,
  title: string | null,
  type: number,
  version: number,
}

export interface FanslyMedia {
  id: string,
  accountId: string,
  createdAt: number,
  filename: string,
  flags: number,
  height: number,
  location: string,
  metadata: string,
  mimetype: string,
  status: number,
  type: number,
  updatedAt: number,
  width: number,
}

export interface FanslyAlbumResponse {
  aggregationData: { media: FanslyMedia[] }
  albums: FanslyAlbum[]
}

export interface FanslyAlbumMediaResponse {
  media: FanslyMedia[]
}