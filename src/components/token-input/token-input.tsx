import { useContext } from "react";
import { tokens } from "../../constants/tokens";
import { AuthContext } from "../../context/AuthContext";
import "./token-input.css";
import { Token } from "@uniswap/sdk-core";
import { prettifyAmount } from "../../lib/ethereum";

export default function TokenInput({
  title,
  token,
  tokenBalance,
  inputValue,
  tokenInputChange,
  setToken,
  setInputValue,
} : {
  title: string,
  token: Token | null,
  tokenBalance: bigint,
  inputValue?: string,
  tokenInputChange?: (event: React.ChangeEvent<HTMLInputElement>) => void,
  setToken: (token: Token) => void,
  setInputValue?: (value: string) => void,
}) {
  const { connectedWallet } = useContext(AuthContext);

  function tokenSelectChange(event: React.ChangeEvent<HTMLSelectElement>) {
    if (!connectedWallet?.chainId) return;
    const token = tokens[connectedWallet.chainId].find(token => token.symbol === event.target.value);
    if (token) {
      setToken(new Token(connectedWallet.chainId, token.address, token.decimals, token.symbol));
    }
  }

  return (
    <div className="token-input">
      <div className="token-input-left">
        <label className="token-input-title" htmlFor="token-input-amount">{title}</label>
        <input
          className="token-input-amount"
          type="text"
          id="token-input-amount"
          onChange={tokenInputChange}
          min={0} value={inputValue}
          disabled={!tokenInputChange} />
      </div>
      <div className="token-input-right">
        <div className="token-select-container">
          <img src={`/images/${token?.symbol?.toLowerCase()}.png`} alt={token?.symbol} />
          <select className="token-select secondary" name="token" id="token" onChange={tokenSelectChange} value={token?.symbol}>
            {
              tokens[connectedWallet?.chainId || 0].map(token => (
                <option key={token.symbol} value={token.symbol}>{token.symbol}</option>
              ))
            }
          </select>
        </div>
        <p
          className={`token-input-balance ${setInputValue ? 'token-input-balance--clickable' : ''}`}
          onClick={() => setInputValue && setInputValue(prettifyAmount(tokenBalance, token?.decimals))}
        >
          Balance: {prettifyAmount(tokenBalance, token?.decimals)}
        </p>
      </div>
    </div>
  )
}