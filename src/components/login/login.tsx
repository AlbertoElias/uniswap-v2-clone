import { useContext } from "react"
import { BrowserProvider } from "ethers"
import { ChainId } from "@uniswap/sdk-core";

import './login.css';
import { AuthContext } from "../../context/AuthContext";

export default function Login() {
  const { setConnectedWallet } = useContext(AuthContext);

  async function signInMetamask() {
    const provider = new BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const network = await provider.getNetwork();

    if (network.chainId.toString() !== ChainId.OPTIMISM.toString()) {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ChainId.OPTIMISM }]
      })
    }
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    setConnectedWallet({
      provider,
      signer,
      address,
      chainId: Number(network.chainId)
    })
  }

  return (
    <button className="login-button" onClick={signInMetamask} disabled={!window.ethereum}>
      <span className="login-button-text">{
        window.ethereum ?
          "Sign In With Metamask" :
          "Metamask not found"
      }</span>
      <img src="/images/metamask.svg" alt="Metamask Logo" className="login-button-logo" />
    </button>
  )
}
