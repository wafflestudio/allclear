const HOST = process.env.HOST ?? 'http://localhost:3000'
const SERVER_BASE_URL = `${HOST}/api`
const REDIS_URL = process.env.REDIS_URL ? `redis://${process.env.REDIS_URL}` : ''

const ELICE_KEY = process.env.ELICE_KEY ?? ''
const ELICE_EMBEDDING_ENDPOINT = process.env.ELICE_EMBEDDING_ENDPOINT ?? ''

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
  // Elice ML API의 키와 임베딩 모델 주소입니다. 둘 다 있어야 의미 검색이 켜집니다.
  ELICE: {
    API_KEY: ELICE_KEY,
    EMBEDDING_ENDPOINT: ELICE_EMBEDDING_ENDPOINT,
    IS_CONFIGURED: ELICE_KEY !== '' && ELICE_EMBEDDING_ENDPOINT !== '',
  },
  KAKAO: {
    CLIENT_ID: process.env.KAKAO_CLIENT_ID ?? '',
    CLIENT_SECRET: process.env.KAKAO_CLIENT_SECRET ?? '',
    REDIRECT_URI: `${SERVER_BASE_URL}/v2/auth/kakao/callback`,
  },
  JWT: {
    SECRET_KEY: process.env.JWT_SECRET_KEY ?? '',
  },
  REDIS: {
    URL: REDIS_URL,
  },
  APP_VERSION_POLICY: {
    API_KEY: process.env.APP_VERSION_POLICY_API_KEY ?? '',
  },

  R2: {
    ACCOUNT_ID: process.env.R2_ACCOUNT_ID ?? '',
    ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ?? '',
    SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ?? '',
    CLUB_IMAGE_BUCKET: 'club-image',
    GET_CLUB_IMAGE_PATH: (filename: string) => `https://cdn.all-clear.cc/club%2F${filename}`,
    DEFAULT_CLUB_IMAGE: 'https://cdn.all-clear.cc/default.png',
  },
  DISCORD: {
    WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL_USER_VOICE ?? '',
  },
}
