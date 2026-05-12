const HOST = process.env.HOST ?? 'http://localhost:3000'
const SERVER_BASE_URL = `${HOST}/api`

export const ENV = {
  HOST,
  API_SERVER_BASE_URL: SERVER_BASE_URL,
  DB: {
    HOST: process.env.DB_HOST ?? 'localhost',
    PORT: Number(process.env.DB_PORT ?? '5432'),
    USERNAME: process.env.DB_USERNAME ?? 'postgres',
    PASSWORD: process.env.DB_PASSWORD ?? '',
    DB_NAME: process.env.DB_NAME ?? 'postgres',
  },
  KAKAO: {
    CLIENT_ID: process.env.KAKAO_CLIENT_ID ?? '',
    CLIENT_SECRET: process.env.KAKAO_CLIENT_SECRET ?? '',
    REDIRECT_URI: `${SERVER_BASE_URL}/v2/auth/kakao/callback`,
  },
  JWT: {
    SECRET_KEY: process.env.JWT_SECRET_KEY ?? '',
  },
  R2: {
    ACCOUNT_ID: process.env.R2_ACCOUNT_ID ?? '',
    ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ?? '',
    SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ?? '',
    CLUB_IMAGE_BUCKET: 'club-image',
    GET_CLUB_IMAGE_PATH: (filename: string) => `https://cdn.all-clear.cc/club%2F${filename}`,
    DEFAULT_CLUB_IMAGE: 'https://cdn.all-clear.cc/default.png',
  },
  SLACK: {
    TOKEN: {
      DRAGONITE: process.env.SLACK_TOKEN_DRAGONITE ?? '',
    },
  },
}
