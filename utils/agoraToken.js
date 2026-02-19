import pkg from 'agora-access-token';
const { RtcTokenBuilder, RtcRole } = pkg;
import { AGORA_APP_CERTIFICATE, AGORA_APP_ID } from "../config/config.js";

export const generateAgoraToken = (channelName, uid) => {
  const appId = AGORA_APP_ID;
  const appCertificate =AGORA_APP_CERTIFICATE;

  const role = RtcRole.PUBLISHER;

  const expirationTimeInSeconds = 3600; // 1 hour
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTimestamp + expirationTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    role,
    privilegeExpireTime
  );

  return token;
};


