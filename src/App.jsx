// src/App.jsx
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { base } from 'wagmi/chains';
import { abi } from './contractAbi';
import { useEffect, useState } from 'react';

const CONTRACT_ADDRESS = '0xB7328ad527925747d2900d74dF1960857F6c2C91';

function App() {
  const { address, isConnected, connector } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();

  const [lastSeed, setLastSeed] = useState('N/A');

  // Hook to handle the transaction for generateSeed()
  const { data: hash, isPending: isGenerating, writeContract } = useWriteContract();

  const handleGenerateSeed = () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: abi,
      functionName: 'generateSeed',
      chainId: base.id,
    });
  };

  // Hook to wait for transaction confirmation
  const { data: receipt } = useWaitForTransactionReceipt({ 
    hash,
    query: {
        onSuccess: () => {
            console.log(`Transaction confirmed: ${hash}`);
            refetchSeed(); 
        }
    }
  });

  // Hook to read the stored seed via getSeed(address)
  const { data: currentSeed, refetch: refetchSeed, isLoading: isReading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: abi,
    functionName: 'getSeed',
    args: [address],
    chainId: base.id,
    query: {
        enabled: isConnected && !!address,
        select: (data) => data.toString(), 
    }
  });

  // Update local state when currentSeed changes
  useEffect(() => {
    if (currentSeed) {
        setLastSeed(currentSeed);
    }
  }, [currentSeed]);


  // --- UI Components ---

  const WalletStatus = () => (
    <div style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '15px' }}>
      <h2>Wallet Status</h2>
      {isConnected ? (
        <div>
          <p>Connected to Base via {connector.name}</p>
          <p>Address: <code>{address}</code></p>
          <button onClick={() => disconnect()}>Disconnect</button>
        </div>
      ) : (
        <div>
          <p>Not Connected. Select a connector:</p>
          {connectors.map((connector) => (
            <button 
              key={connector.uid} 
              onClick={() => connect({ connector })}
              style={{ marginRight: '10px' }}
            >
              Connect {connector.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const GeneratorInterface = () => (
    <div style={{ border: '1px solid #007bff', padding: '15px' }}>
      <h2>Generate & Verify Seed</h2>

      <button 
        onClick={handleGenerateSeed} 
        disabled={isGenerating}
        style={{ padding: '10px 20px', fontSize: '16px' }}
      >
        {isGenerating ? 'Awaiting Confirmation...' : 'Generate New Free Seed'}
      </button>
      <p style={{ marginTop: '10px', color: '#888' }}>
        *Only Base network gas fee is required.
      </p>

      <hr style={{ margin: '20px 0' }} />

      <h3>Your Last Recorded Seed:</h3>
      {isReading ? (
        <p>Loading seed...</p>
      ) : (
        <p style={{ wordBreak: 'break-all', fontWeight: 'bold' }}>
          {lastSeed === '0' || lastSeed === 'N/A' ? 'No seed recorded yet.' : lastSeed}
        </p>
      )}

      {hash && (
        <p>
          Last TX Hash: <a href={`https://basescan.org/tx/${hash}`} target="_blank" rel="noopener noreferrer">Check TX on Basescan...</a>
        </p>
      )}
    </div>
  );


  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Base Public Entropy Generator</h1>
      <p>Contract Address: <code>{CONTRACT_ADDRESS}</code></p>
      
      <WalletStatus />

      {isConnected && <GeneratorInterface />}
    </div>
  );
}

export default App;
