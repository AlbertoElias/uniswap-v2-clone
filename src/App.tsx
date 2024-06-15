import { useContext } from 'react';
import './App.css'
import Swap from './components/swap/swap';
import { AuthContext } from './context/AuthContext';
import { trimEthereumAddress } from './lib/ethereum';

function App() {
  const { connectedWallet } = useContext(AuthContext);

  return (
    <div className="page grid-container">
      <header className="header grid-item--full">
        <h1 className="title">Uniswap v2 Demo</h1>
        {connectedWallet &&
          <p className="address">
            <img className="address-logo" src="/images/metamask.svg" alt="Metamask Logo" />
            <span className="address-text">{trimEthereumAddress(connectedWallet.address)}</span>
          </p>
        }
      </header>
      <main className="main grid-item--full">
        <Swap />
      </main>
    </div>
  )
}

export default App
