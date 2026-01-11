import dotenv from 'dotenv'

dotenv.config()

export const PORT  =process.env.PORT
export const DB_URL = process.env.DB_URL
export const SIGNED_COOKIE_SECRET_KEY  = process.env.SIGNED_COOKIE_SECRET_KEY 
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
export const STRIPE_WEBHOOK_SECRET=  process.env.STRIPE_WEBHOOK_SECRET
export const ADMIN_HEALTHBRIDGE_DOMAIN = process.env.ADMIN_HEALTHBRIDGE_DOMAIN
export const STRIPE_KEY = process.env.STRIPE_KEY
export const STRIPE_SUCCESS_URL = process.env.STRIPE_SUCCESS_URL
export const STRIPE_CANCEL_URL = process.env.STRIPE_CANCEL_URL