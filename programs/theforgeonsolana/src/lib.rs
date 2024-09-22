use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Token, TokenAccount, Mint, Transfer};
use metaplex_token_metadata::state::{Metadata};
use metaplex_token_metadata::ID as METADATA_PROGRAM_ID;

declare_id!("ProgramIDHere"); // Replace with your program ID

#[program]
pub mod solana_mining_tools {
    use super::*;

    pub fn equip_tool(
        ctx: Context<EquipTool>,
        tool_mint: Pubkey,
    ) -> Result<()> {
        let user = &mut ctx.accounts.user;

        // Verify NFT ownership
        let metadata_seeds = &[
            b"metadata",
            METADATA_PROGRAM_ID.as_ref(),
            tool_mint.as_ref(),
        ];
        let (metadata_pda, _) = Pubkey::find_program_address(metadata_seeds, &METADATA_PROGRAM_ID);
        let metadata = Metadata::from_account_info(&ctx.accounts.metadata)?;
        require!(
            metadata.update_authority == user.key(),
            MiningError::NotToolOwner
        );

        // Transfer NFT to the program's equipped account
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.equipped_tool_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let transfer_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(transfer_ctx, 1)?;

        // Initialize or update the equipped tool state
        let mut equipped_tool = ctx.accounts.equipped_tool_state.load_init()?;
        equipped_tool.initialize(tool_mint, 100)?; // Starting durability
        Ok(())
    }

    pub fn use_tool(ctx: Context<UseTool>, amount: u64) -> Result<()> {
        let mut equipped_tool = ctx.accounts.equipped_tool_state.load_mut()?;
        equipped_tool.decrease_durability(amount)?;

        if equipped_tool.durability <= 0 {
            // Burn the NFT
            let cpi_accounts = Burn {
                mint: ctx.accounts.tool_mint.to_account_info(),
                to: ctx.accounts.equipped_tool_account.to_account_info(),
                authority: ctx.accounts.program_authority.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let burn_ctx = CpiContext::new(cpi_program, cpi_accounts);
            token::burn(burn_ctx, 1)?;

            // Close the equipped tool state account
            ctx.accounts.equipped_tool_state.close(ctx.accounts.user.to_account_info())?;
        }

        Ok(())
    }
}

#[derive(Accounts)]
pub struct EquipTool<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    /// CHECK: Verified in the program
    pub metadata: AccountInfo<'info>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub equipped_tool_account: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = user,
        space = 8 + EquippedTool::LEN,
        seeds = [b"equipped_tool", user.key().as_ref(), tool_mint.key().as_ref()],
        bump
    )]
    pub equipped_tool_state: AccountLoader<'info, EquippedTool>,
    pub tool_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct UseTool<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut, has_one = user)]
    pub equipped_tool_state: AccountLoader<'info, EquippedTool>,
    #[account(mut)]
    pub equipped_tool_account: Account<'info, TokenAccount>,
    pub tool_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub program_authority: AccountInfo<'info>,
}

#[account(zero_copy)]
#[derive(Default)]
pub struct EquippedTool {
    pub tool_mint: Pubkey,
    pub durability: u64,
}

impl EquippedTool {
    pub const LEN: usize = 32 + 8; // Pubkey + u64

    pub fn initialize(&mut self, tool_mint: Pubkey, durability: u64) -> Result<()> {
        self.tool_mint = tool_mint;
        self.durability = durability;
        Ok(())
    }

    pub fn decrease_durability(&mut self, amount: u64) -> Result<()> {
        self.durability = self.durability.checked_sub(amount).ok_or(MiningError::InsufficientDurability)?;
        Ok(())
    }
}

#[error_code]
pub enum MiningError {
    #[msg("The user does not own this tool.")]
    NotToolOwner,
    #[msg("Insufficient durability.")]
    InsufficientDurability,
}