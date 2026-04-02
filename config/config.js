import dotenv from 'dotenv'

dotenv.config()
// DEVELOPING ENV
export const DEV_DB_URL =  process.env.DEV_DB_URL
export const DEV_PORT  =process.env.DEV_PORT
export const DEV_ORIGIN_1 = process.env.DEV_ORIGIN_1
export const DEV_ORIGIN_2 = process.env.DEV_ORIGIN_2


export const NODE_ENV = process.env.NODE_ENV

// PRODUCTION ENV

export const PROD_DB_URL = process.env.PROD_DB_URL
export const PROD_SIGNED_COOKIE_SECRET_KEY  = process.env.PROD_SIGNED_COOKIE_SECRET_KEY 
export const PROD_STRIPE_SECRET_KEY = process.env.PROD_STRIPE_SECRET_KEY
export const PROD_STRIPE_WEBHOOK_SECRET=  process.env.PROD_STRIPE_WEBHOOK_SECRET
export const PROD_ADMIN_HEALTHBRIDGE_DOMAIN = process.env.PROD_ADMIN_HEALTHBRIDGE_DOMAIN
export const PROD_HEALTHBIRDGE_DOMAIN = process.env.PROD_HEALTHBIRDGE_DOMAIN
export const PROD_STRIPE_KEY = process.env.PROD_STRIPE_KEY
export const PROD_STRIPE_SUCCESS_URL = process.env.PROD_STRIPE_SUCCESS_URL
export const PROD_STRIPE_CANCEL_URL = process.env.PROD_STRIPE_CANCEL_URL
export const PROD_AWS_S3_BUCKET_NAME = process.env.PROD_AWS_S3_BUCKET_NAME
export const PROD_AGORA_APP_ID = process.env.PROD_AGORA_APP_ID
export const PROD_AGORA_APP_CERTIFICATE  = process.env.PROD_AGORA_APP_CERTIFICATE 
export const PROD_GITHUB_WEBHOOK_SECRET_KEY = process.env.PROD_GITHUB_WEBHOOK_SECRET_KEY