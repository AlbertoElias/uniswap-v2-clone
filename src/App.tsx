import { useContext } from 'react';
import './App.css'
import Swap from './components/swap/swap';
import { AuthContext } from './context/AuthContext';
import { trimEthereumAddress } from './lib/ethereum';

function App() {
  const { connectedWallet } = useContext(AuthContext);

  return (
    <div className="page">
      <header className="header">
        <h1 className="title">Uniswap v2 Demo</h1>
        {connectedWallet &&
          <p className="address secondary">
            <img className="address-logo" src="/images/metamask.svg" alt="Metamask Logo" />
            <span className="address-text">{trimEthereumAddress(connectedWallet.address)}</span>
          </p>
        }
      </header>
      <main className="main">
        <Swap />
      </main>
    </div>
  )
}

export default App
