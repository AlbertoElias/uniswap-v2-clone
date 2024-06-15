import { CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core';
import IUniswapV2Pair from '@uniswap/v2-core/build/IUniswapV2Pair.json';
import IUniswapV2Factory from '@uniswap/v2-core/build/IUniswapV2Factory.json'
import IUniswapV2Router02 from '@uniswap/v2-periphery/build/IUniswapV2Router02.json';
import { Pair, Route, Trade } from '@uniswap/v2-sdk';
import { Contract, ZeroAddress, parseUnits } from 'ethers';``
import ERC20ABI from '../abis/erc-20.json';
import { ConnectedWallet } from '../context/AuthContext';
import { UNISWAP_CONTRACT_ADDRESSES } from '../constants/app';
import { tokens } from '../constants/tokens';

const slippageTolerance = new Percent('50', '10000')

export async function createPair(tokenA: Token, tokenB: Token, connectedWallet: ConnectedWallet): Promise<Pair> {
  const pairAddress = await getPairAddress(tokenA, tokenB, connectedWallet);
  console.log(pairAddress);
  const pairContract = new Contract(pairAddress, IUniswapV2Pair.abi, connectedWallet.signer);
  const reserves = await pairContract["getReserves"]()
  const [reserve0, reserve1] = reserves
  const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA];
  console.log(`Reserves: ${reserves[0]}, ${reserves[1]}`)
  const pair = new Pair(CurrencyAmount.fromRawAmount(token0, reserve0.toString()), CurrencyAmount.fromRawAmount(token1, reserve1.toString()));
  return pair;
}

async function getPairAddress(tokenA: Token, tokenB: Token, connectedWallet: ConnectedWallet) {
  const factoryAddress = UNISWAP_CONTRACT_ADDRESSES[connectedWallet.chainId].factory;
  const factory = new Contract(factoryAddress, IUniswapV2Factory.abi, connectedWallet.signer);

  const pairAddress = await factory.getPair(tokenA.address, tokenB.address);

  if (pairAddress === ZeroAddress) {
    const tx = await factory.createPair(tokenA.address, tokenB.address);
    const receipt = await tx.wait();

    // Find the PairCreated event in the transaction receipt
    const pairCreatedEvent = receipt.events?.find((event: { event: string; }) => event.event === 'PairCreated');
    if (pairCreatedEvent) {
      const newPairAddress = pairCreatedEvent.args?.pair;
      return newPairAddress;
    } else {
      throw new Error('PairCreated event not found in transaction receipt');
    }
  } else {
    return pairAddress
  }
}

async function getReserves(tokenA: Token, tokenB: Token, connectedWallet: ConnectedWallet) {
  const pairAddress = await getPairAddress(tokenA, tokenB, connectedWallet);
  const pairContract = new Contract(pairAddress, IUniswapV2Pair.abi, connectedWallet.signer);
  const reserves = await pairContract["getReserves"]()
  return reserves;
}

function isLiquiditySufficient(amountIn: bigint, reserveIn: bigint, reserveOut: bigint): boolean {
  // Calculate the impact of the swap
  const amountInWithFee = amountIn * BigInt(997);
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * BigInt(1000) + amountInWithFee;
  const amountOut = numerator / denominator;

  console.log(`Amount Out: ${amountOut.toString()}`);
  return amountOut > 0; // Ensure that the output amount is greater than zero
}

export async function calculateTrade(tokenA: Token, tokenB: Token, amountIn: bigint, connectedWallet: ConnectedWallet): Promise<Trade<Token, Token, TradeType>> {
  const pair = await createPair(tokenA, tokenB, connectedWallet);
  const route = new Route([pair], tokenA, tokenB);
  const trade = new Trade(route, CurrencyAmount.fromRawAmount(tokenA, amountIn.toString()), TradeType.EXACT_INPUT)
  return trade;
}

export async function swap(tokenA: Token, tokenB: Token, amountIn: bigint, connectedWallet: ConnectedWallet) {
  const routerAddress = UNISWAP_CONTRACT_ADDRESSES[connectedWallet.chainId].router;
  const address = await connectedWallet.address;
  const path = [tokenA.address, tokenB.address];
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
  const trade = await calculateTrade(tokenA, tokenB, amountIn, connectedWallet);
  const amountOutMin = trade.minimumAmountOut(slippageTolerance).toExact();
  const amountOutMinBigint = parseUnits(amountOutMin, tokenB.decimals);
  const amountInExactBigint = parseUnits(trade.inputAmount.toExact(), tokenA.decimals);

  const tokenAContract = new Contract(tokenA.address, ERC20ABI, connectedWallet.signer);
  const allowance = await tokenAContract.allowance(address, routerAddress);
  if (allowance < amountInExactBigint) {
    const approveTx = await tokenAContract.approve(routerAddress, amountInExactBigint);
    await approveTx.wait();
  }

  const reserves = await getReserves(tokenA, tokenB, connectedWallet);
  const [reserve0, reserve1] = reserves

  const sufficientLiquidity = isLiquiditySufficient(amountInExactBigint, reserve0, reserve1);
  if (!sufficientLiquidity) {
    throw new Error("Insufficient liquidity");
  }

  const wethAddress = tokens[connectedWallet.chainId].find(token => token.symbol === 'ETH')?.address;
  const router = new Contract(routerAddress, IUniswapV2Router02.abi, connectedWallet.signer);
  if (tokenA.address === wethAddress) {
    const tx = await router.swapExactETHForTokens(
      amountOutMinBigint,
      path,
      address,
      deadline,
      { value: amountInExactBigint }
    );
    return tx;
  } else if (tokenB.address === wethAddress) {
    const tx = await router.swapExactTokensForETH(
      amountInExactBigint,
      amountOutMinBigint,
      path,
      address,
      deadline
    );
    return tx;
  } else {
    const tx = await router.swapExactTokensForTokens(
      amountInExactBigint,
      amountOutMinBigint,
      path,
      address,
      deadline
    );
    return tx;
  }
}

export async function getWETH(connectedWallet: ConnectedWallet) {
  const routerAddress = UNISWAP_CONTRACT_ADDRESSES[connectedWallet.chainId].router;
  const router = new Contract(routerAddress, IUniswapV2Router02.abi, connectedWallet.signer);
  const weth = await router.WETH();
  return weth;
}

export async function getFactory(connectedWallet: ConnectedWallet) {
  const routerAddress = UNISWAP_CONTRACT_ADDRESSES[connectedWallet.chainId].router;
  const router = new Contract(routerAddress, IUniswapV2Router02.abi, connectedWallet.signer);
  const factory = await router.factory();
  return factory;
}

//////
//Used these 3 functions to figure out how Uniswap works using contracts directly
export async function getPairs(connectedWallet: ConnectedWallet) {
  const storedPairs = localStorage.getItem('allPairs');
  const allPairs: string[] = storedPairs ? JSON.parse(storedPairs) : [];
  if (allPairs.length > 0) {
    return allPairs;
  }
  const factoryAddress = UNISWAP_CONTRACT_ADDRESSES[connectedWallet.chainId].factory;
  const factory = new Contract(factoryAddress, IUniswapV2Factory.abi, connectedWallet.signer);
  const allPairsLength = await factory.allPairsLength();
  for (let i = 0; i < allPairsLength; i++) {
    try {
      const pair = await factory.allPairs(i);
      allPairs.push(pair);
    } catch (e) {
      console.error(e);
    
    }
  }
  localStorage.setItem('allPairs', JSON.stringify(allPairs));
  return allPairs;
}

export async function getToken(pairAddress: string, connectedWallet: ConnectedWallet) {
  const pair = new Contract(pairAddress, IUniswapV2Pair.abi, connectedWallet.signer);
  try {
    const token0 = await pair.token0();
    const token1 = await pair.token1();
    const reserves = await pair.getReserves();
    return [token0, token1, [reserves[0].toString(), reserves[1].toString()]];
  } catch (e) {
    console.error(e);
    return null;
  }
}
export async function getAmountOut(tokenA: Token, tokenB: Token, amountIn: string, connectedWallet: ConnectedWallet) {
  const routerAddress = UNISWAP_CONTRACT_ADDRESSES[connectedWallet.chainId].router;
  const router = new Contract(routerAddress, IUniswapV2Router02.abi, connectedWallet.signer);
  const amount = amountIn || '0';
  try {
    const amountOut = await router.getAmountsOut(parseUnits(amount, tokenA.decimals).toString(), [tokenA.address, tokenB.address]);
    return amountOut;
  } catch (e) {
    console.error(e);
  }
}
////