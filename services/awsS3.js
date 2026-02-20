import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AWS_S3_BUCKET_NAME } from "../config/config.js";

export const s3Client = new S3Client();


export const createUploadFileToAws = async({key , contentType})=>{
 
    const command = new PutObjectCommand({
      Bucket: AWS_S3_BUCKET_NAME,
      
      Key: key,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300, // 5 minutes
    });
    return signedUrl
}

export const createGetFileFromAws = async({key}) =>{
      const command = new GetObjectCommand({
        Bucket: AWS_S3_BUCKET_NAME,
        Key: key,
      });

    const   profileImageUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 60 * 10, // 10 minutes
      });
      return profileImageUrl
}

export const verifyStorageFile = async({key}) =>{
      // 1️⃣ Verify file exists in S3
    const headCommand = new HeadObjectCommand({
      Bucket: AWS_S3_BUCKET_NAME,
      Key: key,
    });

    const headResult = await s3Client.send(headCommand);
    return headResult;
}