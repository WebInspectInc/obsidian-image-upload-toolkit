import ImageUploader from "../imageUploader";
import AWS from 'aws-sdk';
import {UploaderUtils} from "../uploaderUtils";

export default class DOUploader implements ImageUploader {
  private readonly s3!: AWS.S3;
  private readonly bucket!: string;
  private pathTmpl: string;
  private customDomainName: string;

  constructor(setting: DOSetting) {
    this.s3 = new AWS.S3({
      forcePathStyle: false, // Configures to use subdomain/virtual calling format.
      endpoint: setting.endpoint,
      credentials: {
        accessKeyId: setting.accessKeyId,
        secretAccessKey: setting.secretAccessKey
      },
      region: "us-east-1" // required by DO
    });
    this.bucket = setting.bucketName;
    this.pathTmpl = setting.path;
    this.customDomainName = setting.customDomainName;
  }

  async upload(image: File, fullPath: string): Promise<string> {
    const arrayBuffer = await this.readFileAsArrayBuffer(image);
    const uint8Array = new Uint8Array(arrayBuffer);
    var path = UploaderUtils.generateName(this.pathTmpl, image.name);
    path = path.replace(/^\/+/, ''); // remove the /
    const params = {
      Bucket: this.bucket,
      Key: path,
      Body: uint8Array,
    };
    return new Promise((resolve, reject) => {
      this.s3.upload(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(UploaderUtils.customizeDomainName(data.Location, this.customDomainName));
        }
      });
    });
  }

  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }
}
export interface DOSetting {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucketName: string;
  path: string;
  customDomainName: string;
}