interface PinataResponse {
  success: boolean;
  ipfsHash: string;
  pinSize: number;
  timestamp: string;
  url: string;
}

interface DocumentMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{ trait_type: string; value: string }>;
  created_at?: string;
  invoice_number?: string;
  exporter_company?: string;
  document_type?: string;
}

export class PinataService {
  private apiKey: string;
  private secretApiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = process.env.PINATA_API_KEY!;
    this.secretApiKey = process.env.PINATA_SECRET_API_KEY!;
    this.baseURL = 'https://api.pinata.cloud';

    if (!this.apiKey || !this.secretApiKey) {
      throw new Error('PINATA_API_KEY dan PINATA_SECRET_API_KEY harus diset di environment variables');
    }
  }

  async uploadImage(buffer: Buffer, originalName: string, fileName: string): Promise<PinataResponse> {
    try {
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(buffer)], { type: 'application/octet-stream' });
      
      formData.append('file', blob, originalName);
      
      const pinataMetadata = JSON.stringify({
        name: fileName,
      });
      formData.append('pinataMetadata', pinataMetadata);

      const response = await fetch(`${this.baseURL}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
          'pinata_api_key': this.apiKey,
          'pinata_secret_api_key': this.secretApiKey
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Pinata API Error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();

      return {
        success: true,
        ipfsHash: data.IpfsHash,
        pinSize: data.PinSize,
        timestamp: data.Timestamp,
        url: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`
      };
    } catch (error: any) {
      throw new Error(`Gagal upload image ke Pinata: ${error.message}`);
    }
  }

  async uploadJSON(metadata: DocumentMetadata): Promise<PinataResponse> {
    try {
      const response = await fetch(`${this.baseURL}/pinning/pinJSONToIPFS`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': this.apiKey,
          'pinata_secret_api_key': this.secretApiKey
        },
        body: JSON.stringify(metadata)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Pinata API Error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();

      return {
        success: true,
        ipfsHash: data.IpfsHash,
        pinSize: data.PinSize,
        timestamp: data.Timestamp,
        url: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`
      };
    } catch (error: any) {
      throw new Error(`Gagal upload JSON ke Pinata: ${error.message}`);
    }
  }

  async testAuthentication() {
    try {
      const response = await fetch(`${this.baseURL}/data/testAuthentication`, {
        headers: {
          'pinata_api_key': this.apiKey,
          'pinata_secret_api_key': this.secretApiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(`Authentication gagal: ${error.message}`);
    }
  }
}