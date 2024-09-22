import { umi, wallet } from './umi.config';
import { Program, web3 } from '@metaplex-foundation/umi';
import { findProgramAddressSync } from '@metaplex-foundation/umi/dist/utils/pubkey';
import { EquippedTool } from './types';

// Replace with your deployed program ID
const PROGRAM_ID = new web3.PublicKey('YourProgramIDHere');

// Initialize the program
const program = new Program(EquippedTool, PROGRAM_ID, umi);

export async function useTool(toolMint: string, amount: number) {
  if (!wallet.publicKey) {
    throw new Error('Wallet not connected');
  }

  const toolMintPubkey = new web3.PublicKey(toolMint);
  const userPublicKey = wallet.publicKey;

  // Derive PDAs
  const [equippedToolState, bump] = findProgramAddressSync(
    [Buffer.from('equipped_tool'), userPublicKey.toBuffer(), toolMintPubkey.toBuffer()],
    PROGRAM_ID
  );

  // Find program's token account for the tool
  const programTokenAccount = await getAssociatedTokenAddress(
    toolMintPubkey,
    PROGRAM_ID
  );

  // Prepare instructions
  const instructions = program.instruction.useTool(new web3.BN(amount), {
    accounts: {
      user: userPublicKey,
      equippedToolState: equippedToolState,
      equippedToolAccount: programTokenAccount,
      toolMint: toolMintPubkey,
      tokenProgram: web3.TOKEN_PROGRAM_ID,
      programAuthority: PROGRAM_ID,
    },
  });

  // Send transaction
  const signature = await umi.sendAndConfirm(instructions);

  console.log('Use Tool Transaction Signature:', signature);
}