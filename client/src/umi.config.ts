import { createUmi, useWallet } from '@metaplex-foundation/umi';
import { clusterApiUrl, Connection } from '@solana/web3.js';
import { solanaWalletAdapter } from '@metaplex-foundation/umi-signer-wallet-adapters';

// Initialize Umi
export const umi = createUmi({
    connection: new Connection(clusterApiUrl('devnet')),
    wallet: solanaWalletAdapter(), // Assumes wallet adapter is set up
  });
  
  // Export wallet for use in other modules
  export const wallet = useWallet(umi);