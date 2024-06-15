import { ChainId } from "@uniswap/sdk-core";

interface TokenInfo {
  address: string;
  decimals: number;
  symbol: string;
  logo: string;
}

interface TokensInfo {
  [chainId: number]: TokenInfo[];
}

export const tokens: TokensInfo = {
  [ChainId.SEPOLIA]: [
    {
      address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
      decimals: 6,
      symbol: "USDC",
      logo: "usdc.png"
    },
    {
      address: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
      decimals: 18,
      symbol: "ETH",
      logo: "eth.png"
    }
  ],
  [ChainId.OPTIMISM]: [
    {
      address: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
      decimals: 6,
      symbol: "USDC",
      logo: "usdc.png"
    },
    {
      address: "0x4200000000000000000000000000000000000006",
      decimals: 18,
      symbol: "ETH",
      logo: "eth.png"
    }
  ],
}