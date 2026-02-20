import crypto from 'crypto'
import { GITHUB_WEBHOOK_SECRET_KEY } from '../config/config.js'




export const  CalculatedGithubWebhookSignature  = (req) =>{
   const signature = req.headers['x-hub-signature-256']; // GitHub signature
  const payloadRaw = JSON.stringify(req.body);          // raw JSON payload

  const hmac = crypto.createHmac('sha256', GITHUB_WEBHOOK_SECRET_KEY);
  hmac.update(payloadRaw);
  const digest = `sha256=${hmac.digest('hex')}`;

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest)); 
 
} 