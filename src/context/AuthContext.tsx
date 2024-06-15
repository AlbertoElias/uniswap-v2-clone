import { JsonRpcSigner, BrowserProvider } from "ethers";
import { createContext, useState } from "react";

export interface ConnectedWallet {
  provider: BrowserProvider;
  signer: JsonRpcSigner;
  address: string;
  chainId: number;
}

interface AuthContextType {
  connectedWallet: ConnectedWallet | null;
  setConnectedWallet: (connectedWallet: ConnectedWallet) => void;
}

export const AuthContext = createContext<AuthContextType>({
  connectedWallet: null,
  setConnectedWallet: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectedWallet, setConnectedWallet] = useState<ConnectedWallet | null>(null);

  return (
    <AuthContext.Provider value={{ connectedWallet, setConnectedWallet }}>
      {children}
    </AuthContext.Provider>
  );
}