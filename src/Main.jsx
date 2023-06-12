import { ExplorerApi, RpcApi } from 'atomicassets';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import React, { useContext, useState, useEffect, useCallback } from 'react';
import './Main.css';
import { RpcError } from 'eosjs';
import { JsonRpc } from 'eosjs';
import { UALContext } from 'ual-reactjs-renderer';
import Chickens from './components/Chickens/Chickens';
import Foxes from './components/Foxes/Foxes';
import Exchange from './components/Exchange/Exchange';
import StakeNFTs from './components/StakeNFTs/StakeNFTs';
import Settings from './components/Settings/Settings';
import Shop from "./components/Shop/Shop";
import Missions from "./components/Missions/Missions";


const Main = () => {
  const ual = useContext(UALContext);
  const [owner, setOwner] = useState('');
  const [referrer, setReferrer] = useState('');
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [rpcUrl, setRpcUrl] = useState(localStorage.getItem("rpcUrl") || "https://test.wax.eosusa.io/");
  const [apiUrl, setApiUrl] = useState(localStorage.getItem("apiUrl") || "https://test.wax.eosusa.io/");
  const [ipfsUrl, setIpfsUrl] = useState(localStorage.getItem("ipfsUrl") || "https://ipfs.io/ipfs");

  const rpc = new JsonRpc(rpcUrl);

  const handleSettingsChange = useCallback((newRpcUrl, newApiUrl, newIpfsUrl) => {
    setRpcUrl(newRpcUrl);
    setApiUrl(newApiUrl);
    setIpfsUrl(newIpfsUrl);
    localStorage.setItem("rpcUrl", newRpcUrl);
    localStorage.setItem("apiUrl", newApiUrl);
    localStorage.setItem("ipfsUrl", newIpfsUrl);
  }, []);

  useEffect(() => {
    const checkSignup = async () => {
      if (ual.activeUser) {
        const result = await rpc.get_table_rows({
          json: true,
          code: 'dcycmissions',
          scope: 'dcycmissions',
          table: 'users',
          lower_bound: ual.activeUser.accountName,
          upper_bound: ual.activeUser.accountName,
          limit: 1,
        });
        setIsSignedUp(result.rows.length > 0);
      }
    };
    checkSignup();
  }, [ual.activeUser]);

  const login = () => {
    ual.logout();
    ual.showModal();
  };

  const logout = () => {
    ual.logout();
  };

  const testTransaction = async () => {
    try {
      const { activeUser } = ual;

      const { accountName } = activeUser;
      let { requestPermission } = activeUser;
      if (!requestPermission && activeUser.scatter) {
        // workaround for scatter
        requestPermission = activeUser.scatter.identity.accounts[0].authority;
      }

      // submit the transaction
      const transaction = await activeUser.signTransaction({
        actions: [{
          account: "dcycmissions",
          name: "signup",
          authorization: [
            {
              actor: accountName,
              permission: requestPermission,
            }
          ],
          data: {
            owner: owner,
            referrer: referrer,
          }
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 120,
        broadcast: true,
      });
      console.log(transaction);
      alert("Transaction ID: " + transaction?.transactionId);
    } catch (e) {
      alert(e.toString());
      console.error(e);
      if (e instanceof RpcError)
        console.log(JSON.stringify(e.json, null, 2));
    }
  }

  return (
    <div className="app">
      <Settings
        ual={ual} // Pass the ual object
        logout={logout} // Pass the logout function
        rpcUrl={rpcUrl}
        apiUrl={apiUrl}
        ipfsUrl={ipfsUrl}
        onChange={handleSettingsChange}
      />
      {ual?.activeUser ? (
        <>
          <div>Welcome, {ual.activeUser.accountName}</div>
          <nav>
            <ul>
              <li>
                <Link to="/Chickens">Chickens</Link>
              </li>
              <li>
                <Link to="/Foxes">Foxes</Link>
              </li>
              <li>
                <Link to="/Exchange">Exchange</Link>
              </li>
              <li>
                <Link to="/StakeNFTs">StakeNFTs</Link>
              </li>
              <li>
                <Link to="/Shop">Shop</Link>
              </li>
              <li>
                <Link to="/Missions">Missions</Link>
              </li>
            </ul>
          </nav>
          <Routes>
            <Route path="/Chickens" element={<Chickens rpc={rpc} apiUrl={apiUrl} ipfsUrl={ipfsUrl} />} />
            <Route path="/Foxes" element={<Foxes rpc={rpc} apiUrl={apiUrl} ipfsUrl={ipfsUrl} />} />
            <Route path="/Exchange" element={  <Exchange ual={ual} rpc={rpc} />} />
            <Route path="/StakeNFTs" element={<StakeNFTs rpc={rpc} apiUrl={apiUrl} ipfsUrl={ipfsUrl} />} />
            <Route path="/Shop" element={<Shop rpc={rpc} apiUrl={apiUrl} ipfsUrl={ipfsUrl} ual={ual} />} />
            <Route path="/Missions" element={<Missions rpc={rpc} apiUrl={apiUrl} ipfsUrl={ipfsUrl} ual={ual} />} />
          </Routes>
          </>
      ) : null} {/* Remove the login button here */}
    </div>

  );
};

export default Main;