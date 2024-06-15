import { useContext, useEffect, useState } from 'react';
import { Token } from '@uniswap/sdk-core'
import { parseUnits } from 'ethers';

import './swap.css';
import { AuthContext } from '../../context/AuthContext';
import { calculateTrade, swap } from '../../lib/uniswap';
import { getBalance, getValidAmountRegex, trimEthereumAddress } from '../../lib/ethereum';
import { BLOCK_EXPLORERS, significantDigits } from '../../constants/app';
import { tokens } from '../../constants/tokens';
import Login from '../login/login';
import TokenInput from '../token-input/token-input';

export default function Swap() {
  const { connectedWallet } = useContext(AuthContext);
  const [tokenA, setTokenA] = useState<Token | null>(null);
  const [tokenB, setTokenB] = useState<Token | null>(null);
  const [tokenABalance, setTokenABalance] = useState(0);
  const [tokenBBalance, setTokenBBalance] = useState(0);
  const [inputValue, setInputValue] = useState('0');
  const [inputAmount, setInputAmount] = useState(BigInt(0));
  const [outputAmount, setOutputAmount] = useState('0');
  const [invalidAmount, setInvalidAmount] = useState(false);
  const [fundsExceeded, setFundsExceeded] = useState(false);
  const [canSwap, setCanSwap] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState('');

  useEffect(() => {
    if (!connectedWallet?.chainId) return
    const currentChainTokens = tokens[connectedWallet.chainId];
    setTokenA(new Token(connectedWallet.chainId, currentChainTokens[0].address, currentChainTokens[0].decimals, currentChainTokens[0].symbol));
    setTokenB(new Token(connectedWallet.chainId, currentChainTokens[1].address, currentChainTokens[1].decimals, currentChainTokens[1].symbol));
  }, [connectedWallet?.chainId])

  useEffect(() => {
    if (!tokenA || !tokenB) return
    if (!connectedWallet?.signer) return
  
    const fetchBalances = async () => {
      if (tokenA) {
        const tokenABalance = await getBalance(tokenA.address, connectedWallet)
        setTokenABalance(tokenABalance.toString())
      }
      if (tokenB) {
        const tokenBBalance = await getBalance(tokenB.address, connectedWallet)
        setTokenBBalance(tokenBBalance.toString())
      }
    }
  
    fetchBalances()
    handleInputChange(inputValue)
  }, [connectedWallet?.signer, tokenA, tokenB])

  if (!connectedWallet?.signer) {
    return <Login />
  }

  async function handleInputChange(newValue: string) {
    const validAmountRegex = getValidAmountRegex(tokenA?.decimals || 0);
    if (!connectedWallet?.signer ||
      !tokenA ||
      !tokenB ||
      !validAmountRegex.test(newValue)) return;
  
    // Removes leading 0s unless it's a decimal number
    const valueWithoutLeadingZeros = newValue.replace(/^(0(?!\.))+/, '');
    const value = valueWithoutLeadingZeros.length > 0 ? valueWithoutLeadingZeros : "0";
    const newAmount = parseUnits(value, tokenA.decimals);
    setInputValue(value);
    setInputAmount(newAmount);
    const isNewAmountExceedingFunds = newAmount > BigInt(tokenABalance);
    const isAmountNegative = newAmount < BigInt(0);

    try {
      const predictedTrade = await calculateTrade(tokenA, tokenB, newAmount, connectedWallet);
      setOutputAmount(predictedTrade.outputAmount.toFixed(significantDigits))
      if (isNewAmountExceedingFunds) {
        setFundsExceeded(true);
      }
      if (isAmountNegative) {
        setInvalidAmount(true);
      } 
      
      if (isNewAmountExceedingFunds || isAmountNegative) {
        setCanSwap(false);
        return;
      } else {
        setCanSwap(true);
        setFundsExceeded(false);
        setInvalidAmount(false);
      }
    } catch (e) {
      console.error(e);
      setOutputAmount('0');
      setCanSwap(false);
    }
  }

  function tokenAInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    handleInputChange(event.target.value);
  }

  function switchTokens() {
    const newTokenA = tokenB;
    setTokenB(tokenA);
    setTokenA(newTokenA);
  }

  async function handleSwap() {
    if (!connectedWallet?.signer || !tokenA || !tokenB) return;
    setIsLoading(true);
    try {
      const tx = await swap(tokenA, tokenB, inputAmount, connectedWallet);
      setTxHash(tx.hash);
      await tx.wait();
      setTimeout(() => setTxHash(''), 5000);
      handleInputChange('0');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="swap">
      <h2 className="swap-title">Swap</h2>

      <TokenInput
        title={"Sell"}
        token={tokenA}
        tokenBalance={BigInt(tokenABalance)}
        inputValue={inputValue}
        tokenInputChange={tokenAInputChange}
        setToken={setTokenA}
        setInputValue={(value) => handleInputChange(value)}
      />

      <button className="switch-tokens secondary" onClick={switchTokens}>
        <img src="/images/switch.svg" alt="Switch tokens" />
      </button>

      <TokenInput
        title={"Buy"}
        token={tokenB}
        tokenBalance={BigInt(tokenBBalance)}
        inputValue={outputAmount}
        setToken={setTokenB}
      />

      <button className={`swap-button ${isLoading && "loading"}`} onClick={handleSwap} disabled={!canSwap}>
        <span className="swap-button-text">
          {
            canSwap ?
              'Swap' :
                invalidAmount ?
                  'Invalid amount' :
                  fundsExceeded ?
                    'Insufficient funds' :
                    'Unable to Swap'
          }
        </span>
        <span className="spinner"></span>
      </button>

      {txHash &&
        <p className="tx-hash">
          <span>Transaction Hash:</span>
          <a
            className="tx-hash-link"
            href={`${BLOCK_EXPLORERS[connectedWallet.chainId]}/tx/${txHash}`}
            target="_blank">
              {trimEthereumAddress(txHash)}
            </a>
        </p>}
    </div>
  )
}