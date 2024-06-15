import { Contract } from 'ethers';
import ERC20ABI from '../abis/erc-20.json';
import { ConnectedWallet } from '../context/AuthContext';
import { tokens } from '../constants/tokens';
import { significantDigits } from '../constants/app';

export async function getBalance(tokenAddress: string, connectedWallet: ConnectedWallet) {
  const wethAddress = tokens[connectedWallet.chainId].find(token => token.symbol === 'ETH')?.address;
  if (tokenAddress === wethAddress) {
    return connectedWallet.provider.getBalance(connectedWallet.address);
  } else {
    const contract = new Contract(tokenAddress, ERC20ABI, connectedWallet.signer);
    return contract.balanceOf(connectedWallet.address);
  }
}

export function getValidAmountRegex(decimals: number) {
  return new RegExp(`^\\d*(?:\\.\\d{0,${decimals}})?$`);
}

export function trimEthereumAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function prettifyAmount(amount: bigint, decimals: number = significantDigits) {
  const amountWithDecimals = Number(amount) / 10 ** decimals;
  return amountWithDecimals.toFixed(significantDigits);
}