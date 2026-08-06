import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { ENV } from '../../ENV'
import * as Stream from 'stream'
import { PassThrough } from 'stream'
import { Upload } from '@aws-sdk/lib-storage'

const S3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ENV.R2.ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ENV.R2.ACCESS_KEY_ID,
    secretAccessKey: ENV.R2.SECRET_ACCESS_KEY,
  },
})

export const uploadClubImage = async (key: string, body: string | Uint8Array | Buffer) => {
  const objectKey = `clubs/${key}`
  const command = new PutObjectCommand({
    ACL: 'public-read',
    Body: body,
    Bucket: ENV.R2.CLUB_IMAGE_BUCKET,
    Key: objectKey,
  })
  await S3.send(command)
}

export const uploadClubImageStream = async (
  key: string,
  readableStream: Stream,
  mimetype: string,
) => {
  const passThroughStream = new PassThrough()
  try {
    const parallelUploads3 = new Upload({
      client: S3,
      params: {
        ACL: 'public-read',
        Body: passThroughStream,
        Bucket: ENV.R2.CLUB_IMAGE_BUCKET,
        Key: key,
        ContentType: mimetype,
      },
      queueSize: 4,
      partSize: 1024 * 1024 * 20,
      leavePartsOnError: false,
    })
    readableStream.pipe(passThroughStream)
    return await parallelUploads3.done()
  } catch (e) {
    console.error(e)
    throw e
  }
}
