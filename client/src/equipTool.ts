import { umi, wallet } from './umi.config';
import { publicKey, Token, Nft } from '@metaplex-foundation/mpl-core';
import { getAssociatedTokenAddress, createAssociatedTokenAccount } from '@solana/spl-token';
import { Program, web3 } from '@metaplex-foundation/umi';
import { findProgramAddressSync } from '@metaplex-foundation/umi/dist/utils/pubkey';
import { MiningError, EquippedTool } from './types';

// Replace with your deployed program ID
const PROGRAM_ID = new web3.PublicKey('YourProgramIDHere');

// Initialize the program
const program = new Program(EquippedTool, PROGRAM_ID, umi);

export async function equipTool(toolMint: string) {
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

  // Find user's token account for the tool
  const userTokenAccount = await getAssociatedTokenAddress(
    toolMintPubkey,
    userPublicKey
  );

  // Find program's token account for the tool
  const programTokenAccount = await getAssociatedTokenAddress(
    toolMintPubkey,
    PROGRAM_ID
  );

  // Create program's token account if it doesn't exist
  const account = await umi.rpc.getAccount(programTokenAccount);
  if (!account.exists) {
    await umi.rpc.sendAndConfirmTransaction(
      web3.SystemProgram.createAccount({
        fromPubkey: userPublicKey,
        newAccountPubkey: programTokenAccount,
        lamports: await umi.rpc.getMinimumBalanceForRentExemption(Token.accountSize),
        space: Token.accountSize,
        programId: web3.TOKEN_PROGRAM_ID,
      })
    );
  }

  // Get metadata PDA
  const METADATA_PROGRAM_ID = new web3.PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
  const [metadataPDA] = web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      METADATA_PROGRAM_ID.toBuffer(),
      toolMintPubkey.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  );

  // Prepare instructions
  const instructions = program.instruction.equipTool(toolMintPubkey, {
    accounts: {
      user: userPublicKey,
      metadata: metadataPDA,
      userTokenAccount: userTokenAccount,
      equippedToolAccount: programTokenAccount,
      equippedToolState: equippedToolState,
      toolMint: toolMintPubkey,
      tokenProgram: web3.TOKEN_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
      rent: web3.SYSVAR_RENT_PUBKEY,
    },
  });

  // Send transaction
  const signature = await umi.sendAndConfirm(instructions);

  console.log('Equip Tool Transaction Signature:', signature);
}