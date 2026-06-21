import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { json, getUserId, parseBody } from '../lib/http.mjs';

const s3 = new S3Client({});
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// POST /upload-url  body: { contentType }
// Returns a short-lived presigned PUT URL the client uploads the photo to,
// plus the public URL to store on the profile.
export const handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return json(401, { error: 'unauthorized' });

  const body = parseBody(event) || {};
  const contentType = ALLOWED_TYPES.includes(body.contentType) ? body.contentType : 'image/jpeg';
  const ext = contentType.split('/')[1].replace('jpeg', 'jpg');

  const bucket = process.env.MEDIA_BUCKET;
  const region = process.env.AWS_REGION;
  const key = `photos/${userId}/${Date.now()}.${ext}`;

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
    { expiresIn: 300 }
  );

  return json(200, {
    uploadUrl,
    key,
    publicUrl: `https://${bucket}.s3.${region}.amazonaws.com/${key}`,
  });
};
