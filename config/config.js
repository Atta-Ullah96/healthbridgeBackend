import dotenv from 'dotenv'

dotenv.config()
export const DEVELOPING_DB_URL =  process.env.DEVELOPING_DB_URL
export const PORT  =process.env.PORT
export const DB_URL = process.env.DB_URL
export const SIGNED_COOKIE_SECRET_KEY  = process.env.SIGNED_COOKIE_SECRET_KEY 
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
export const STRIPE_WEBHOOK_SECRET=  process.env.STRIPE_WEBHOOK_SECRET
export const ADMIN_HEALTHBRIDGE_DOMAIN = process.env.ADMIN_HEALTHBRIDGE_DOMAIN
export const STRIPE_KEY = process.env.STRIPE_KEY
export const STRIPE_SUCCESS_URL = process.env.STRIPE_SUCCESS_URL
export const STRIPE_CANCEL_URL = process.env.STRIPE_CANCEL_URL
export const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME
export const AGORA_APP_ID = process.env.AGORA_APP_ID
export const AGORA_APP_CERTIFICATE  = process.env.AGORA_APP_CERTIFICATE 
export const HEALTHBIRDGE_DOMAIN = process.env.HEALTHBIRDGE_DOMAIN