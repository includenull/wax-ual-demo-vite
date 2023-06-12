import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import { JsonRpc } from 'eosjs';
import { UALProvider } from 'ual-reactjs-renderer';
import { Anchor } from 'ual-anchor';
import { Wax } from 'ual-wax';
import Main from './Main';
import { useContext } from 'react';
import { UALContext } from 'ual-reactjs-renderer';


const App = () => {
  const appName = "wax-ual-demo";

  const chains = {
    chainId: "f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12",
    rpcEndpoints: [
      {
        protocol: 'https',
        host: 'test.wax.eosusa.io',
        port: 443,
      }
    ],
  }

  const endpoint = `${chains.rpcEndpoints[0].protocol}://${chains.rpcEndpoints[0].host}:${chains.rpcEndpoints[0].port}`;
  const rpc = new JsonRpc(endpoint);
  

  const ual = useContext(UALContext);

  const anchor = new Anchor([chains], { appName: appName });
  const wcw = new Wax([chains]);

  return (
    <UALProvider
      appName={appName}
      authenticators={[anchor, wcw]}
      chains={[chains]}
    >
      <BrowserRouter>
      <Main rpc={rpc} ual={ual} />
      </BrowserRouter>
    </UALProvider>
  );
}

export default App;
