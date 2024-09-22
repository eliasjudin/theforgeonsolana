Prototype of the **forge** for [minechain.gg](https://www.minechain.gg/)

## Features
- **NFT-Based Tools:** Represent mining tools as NFTs with unique attributes and durability.
- **Durability Mechanics:** Tools degrade with use, adding a layer of strategy and resource management.
- **Automated Burning:** NFTs are automatically burned when durability is depleted, reflecting tool wear.
- **Umi and MPL Core Integration:** Utilize modern libraries for efficient and robust client-side interactions.

### Structure
- **/programs/theforgeonsolana**: Contains the Solana smart contract (program) code.
- **/client**: Holds the client-side TypeScript code for interacting with the smart contract using Umi and MPL Core.
- **/metadata**: Stores JSON files defining the metadata for each NFT tool.

### Implementation

- **`equip_tool` Function:** Equips a tool by transferring the NFT from the user's account to the program's controlled account and initializes the tool's durability.
- **`use_tool` Function:** Decreases the tool's durability and burns the NFT if durability reaches zero.
- **`EquippedTool` Account:** Stores the tool's mint address and current durability.