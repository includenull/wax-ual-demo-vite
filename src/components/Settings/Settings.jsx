import React, { useState, useContext } from 'react';
import { FiSettings } from 'react-icons/fi';
import './Settings.css';
import { UALContext } from 'ual-reactjs-renderer';

const rpcChoices = [
  { label: "WAX Testnet (Aloha)", url: "https://api.waxtest.alohaeos.com" },
  { label: "WAX Testnet (EOSAmsterdam)", url: "https://waxtest.eu.eosamsterdam.net" },
  { label: "WAX Testnet (Nefty)", url: "https://wax-public-testnet.neftyblocks.com" },
  { label: "WAX Testnet (Blocraft)", url: "https://wax-test.blokcrafters.io" },
  { label: "WAX Testnet (defibox)", url: "https://waxtest.defibox.xyz" },
  { label: "WAX Testnet (dapplica)", url: "https://wax-testnet.dapplica.io" },
  { label: "WAX Testnet (wecan)", url: "https://api-wax-testnet.wecan.dev" },
  { label: "WAX Testnet (dapplica)", url: "https://wax-testnet.dapplica.io" },
  // Add more RPC choices here
];

const apiChoices = [
  { label: "WAX Testnet (Aloha)", url: "https://api.waxtest.alohaeos.com" },
  { label: "WAX Testnet (EOSAmsterdam)", url: "https://waxtest.eu.eosamsterdam.net" },
  { label: "WAX Testnet (Nefty)", url: "https://wax-public-testnet.neftyblocks.com" },
  { label: "WAX Testnet (Blocraft)", url: "https://wax-test.blokcrafters.io" },
  { label: "WAX Testnet (deosdac)", url: "https://waxtest-aa.eosdac.io" },
  { label: "WAX Testnet (dapplica)", url: "https://wax-testnet.dapplica.io" },
  { label: "WAX Testnet (wecan)", url: "https://api-wax-testnet.wecan.dev" },
  { label: "WAX Testnet (eosusa)", url: "https://test.wax.eosusa.io" },
  // Add more API choices here
];

const ipfsChoices = [
  { label: "IPFS.io", url: "https://ipfs.io/ipfs" },
  { label: "Another IPFS Provider", url: "https://gateway.ipfs.io" },
  // Add more IPFS choices here
];

const Settings = ({ ual, rpcUrl, apiUrl, ipfsUrl, onChange }) => {
    const [settingsVisible, setSettingsVisible] = useState(false);

  const toggleSettings = () => {
    setSettingsVisible(!settingsVisible);
  };

  const handleSave = () => {
    onChange(selectedRpcUrl, selectedApiUrl, selectedIpfsUrl);
    setSettingsVisible(false);
  };

  const [selectedRpcUrl, setSelectedRpcUrl] = useState(rpcUrl);
  const [selectedApiUrl, setSelectedApiUrl] = useState(apiUrl);
  const [selectedIpfsUrl, setSelectedIpfsUrl] = useState(ipfsUrl);

  const logout = () => {
    ual.logout();
  };

  return (
    <div className="settings-container">
      <FiSettings className="settings-icon" onClick={toggleSettings} />
      {settingsVisible && (
        <div className="settings-window">
          <label>
            RPC Provider
            <select value={selectedRpcUrl} onChange={(e) => setSelectedRpcUrl(e.target.value)}>
              {rpcChoices.map((choice, index) => (
                <option key={index} value={choice.url}>{choice.label}</option>
              ))}
            </select>
          </label>
          <label>
            API Endpoint
            <select value={selectedApiUrl} onChange={(e) => setSelectedApiUrl(e.target.value)}>
              {apiChoices.map((choice, index) => (
                <option key={index} value={choice.url}>{choice.label}</option>
              ))}
            </select>
          </label>
          <label>
            IPFS Provider
            <select value={selectedIpfsUrl} onChange={(e) => setSelectedIpfsUrl(e.target.value)}>
              {ipfsChoices.map((choice, index) => (
                <option key={index} value={choice.url}>{choice.label}</option>
              ))}
            </select>
          </label>
          <button onClick={handleSave}>Save</button>
          {ual?.activeUser ? (
            <button onClick={() => ual.logout()}>Logout</button>
          ) : (
            <button onClick={() => ual.showModal()}>Login</button>
          )}
        </div>
      )}
    </div>
  );
};

export default Settings;
