import { appConfig } from '@/config';

const PINATA_API_URL = 'https://api.pinata.cloud';

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

interface PinataOptions {
  pinataMetadata?: {
    name?: string;
    keyvalues?: Record<string, string>;
  };
  pinataOptions?: {
    cidVersion?: 0 | 1;
  };
}

export async function uploadToIPFS(
  data: object | File,
  options?: PinataOptions
): Promise<string> {
  const jwt = process.env.PINATA_JWT;
  
  if (!jwt) {
    console.warn('⚠️ Pinata JWT not configured, using mock IPFS hash');
    // Return mock IPFS hash for testing
    return `QmMock${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  }

  const formData = new FormData();

  if (data instanceof File) {
    formData.append('file', data);
  } else {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    formData.append('file', blob, 'metadata.json');
  }

  if (options?.pinataMetadata) {
    formData.append('pinataMetadata', JSON.stringify(options.pinataMetadata));
  }

  if (options?.pinataOptions) {
    formData.append('pinataOptions', JSON.stringify(options.pinataOptions));
  }

  const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload to IPFS: ${error}`);
  }

  const result: PinataResponse = await response.json();
  return result.IpfsHash;
}

export async function uploadJSONToIPFS(
  data: object,
  name?: string
): Promise<string> {
  const jwt = process.env.PINATA_JWT;
  
  if (!jwt) {
    throw new Error('Pinata JWT not configured in server environment');
  }

  const response = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({
      pinataContent: data,
      pinataMetadata: {
        name: name || 'seatrax-metadata',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload JSON to IPFS: ${error}`);
  }

  const result: PinataResponse = await response.json();
  return result.IpfsHash;
}

export async function fetchFromIPFS<T>(hash: string): Promise<T> {
  const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs';
  const url = `${gateway}/${hash}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
  }

  return response.json();
}

export function getIPFSUrl(hash: string): string {
  const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs';
  return `${gateway}/${hash}`;
}
