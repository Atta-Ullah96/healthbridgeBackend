import pkg from "agora-access-token";

const { RtcTokenBuilder, RtcRole } = pkg;
export const generateAgoraToken = ({
  appId,
  appCertificate,
  channelName,
  uid,
  expireInSeconds = 3600,
  role
}) => {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpireTs = currentTimestamp + expireInSeconds;

  return RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    role,
    privilegeExpireTs
  );
};
