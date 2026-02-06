import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import * as FormData from 'form-data';

@Injectable()
export class UploadsService {
  async uploadToIPFS(file: Express.Multer.File) {
    try {
      const formData = new FormData();
      formData.append('file', file.buffer, {
        filename: file.originalname,
      });

      const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
        headers: {
          ...formData.getHeaders(),
          pinata_api_key: process.env.PINATA_API_KEY,
          pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
        },
      });

      const cid = res.data.IpfsHash;

      return {
        ipfsUrl: `ipfs://${cid}`,
        gatewayUrl: `https://gateway.pinata.cloud/ipfs/${cid}`,
      };
    } catch (err) {
      throw new InternalServerErrorException('Failed to upload file to IPFS');
    }
  }

  async uploadMetadata(metadata: any) {
    try {
      const res = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', metadata, {
        headers: {
          pinata_api_key: process.env.PINATA_API_KEY,
          pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
          'Content-Type': 'application/json',
        },
      });

      const cid = res.data.IpfsHash;

      return {
        metadataUri: `ipfs://${cid}`,
      };
    } catch (err) {
      throw new InternalServerErrorException('Failed to upload metadata to IPFS');
    }
  }
}
