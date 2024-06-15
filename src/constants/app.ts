import { ChainId } from "@uniswap/sdk-core";

export const significantDigits = 6;

interface ContractAddresses {
  [chainId: number]: {
    factory: string;
    router: string;
  }
}

// Fetched from https://docs.uniswap.org/contracts/v2/reference/smart-contracts/v2-deployments
export const UNISWAP_CONTRACT_ADDRESSES: ContractAddresses = {
  [ChainId.SEPOLIA]: {
    'factory': '0xB7f907f7A9eBC822a80BD25E224be42Ce0A698A0',
    'router': '0x425141165d3DE9FEC831896C016617a52363b687'
  },
  [ChainId.OPTIMISM]: {
    'factory': '0x0c3c1c532F1e39EdF36BE9Fe0bE1410313E074Bf',
    'router': '0x4A7b5Da61326A6379179b40d00F57E5bbDC962c2'
  }
}

interface BlockExplorers {
  [chainId: number]: string;
}

export const BLOCK_EXPLORERS: BlockExplorers = {
  [ChainId.SEPOLIA]: 'https://sepolia.etherscan.io/',
  [ChainId.OPTIMISM]: 'https://optimistic.etherscan.io/'
}