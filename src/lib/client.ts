/**
 * Thirdweb Client Configuration
 * 
 * Creates a Thirdweb client instance for use outside of React hooks.
 * For React components, use usePanna() hook which provides the client.
 */

import { createThirdwebClient } from 'thirdweb';

export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || 'demo',
});
