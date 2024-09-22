import { equipTool } from './equipTool';
import { useTool } from './useTool';

const toolMintAddress = 'ToolMintAddressHere'; // Replace with actual tool mint address

async function main() {
  try {
    // Equip the tool
    await equipTool(toolMintAddress);

    // Use the tool, decreasing durability by 10
    await useTool(toolMintAddress, 10);

    console.log('Tool equipped and used successfully.');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();