import React from 'react';
import { UALContext } from 'ual-reactjs-renderer';
import { ExplorerApi } from 'atomicassets';
import { useEffect, useState, useMemo } from 'react';
import FoxModal from './FoxModal';
import './Foxes.css';

const Foxes = ({ rpc, ipfsUrl, apiUrl }) => {
  const [foxes, setFoxes] = useState([]);
  const [selectedFox, setSelectedFox] = useState(null);
  const [stolenNFTs, setStolenNFTs] = useState([]);
  const [claimableStolenNFTs, setClaimableStolenNFTs] = useState({});
  const { activeUser } = React.useContext(UALContext);
  const explorerApi = new ExplorerApi(apiUrl, 'atomicassets', { fetch: fetch.bind(window) });


  const claimableNFTCounts = useMemo(() => {
    const counts = {};
    foxes.forEach(fox => {
      const claimableForFox = stolenNFTs.filter(
        ({ start_weight, end_weight }) =>
          fox.data.weight_start <= start_weight && fox.data.weight_end >= end_weight
      );
      counts[fox.asset_id] = claimableForFox.length;
    });
    return counts;
  }, [foxes, stolenNFTs]);
  
  const fetchStolenNFTs = async () => {
    const result = await rpc.get_table_rows({
      json: true,
      code: 'dcycstealing',
      scope: 'dcycthiefnft',
      table: 'stolennfts',
      limit: -1,
    });

    setStolenNFTs(result.rows);
  };

  useEffect(() => {
    fetchStolenNFTs();

    const getStakedNFTs = async () => {
      const stakedResult = await rpc.get_table_rows({
        code: 'dcycmissions',
        scope: activeUser.accountName,
        table: 'staked',
        limit: 1000,
      });

      const stakedAssets = stakedResult.rows.map(row => row.asset_id);

      const assetPromises = stakedAssets.map(async (asset_id) => {
        const asset = await explorerApi.getAsset(asset_id);
        return asset;
      });

      const foxes = await Promise.all(assetPromises);

      setFoxes(foxes);
    };

    getStakedNFTs();
  }, []);

  const handleClick = (fox) => {
    const claimableForFox = stolenNFTs.filter(
      ({ start_weight, end_weight }) =>
        fox.data.weight_start <= start_weight && fox.data.weight_end >= end_weight
    );

    setClaimableStolenNFTs(prev => ({
      ...prev,
      [fox.asset_id]: claimableForFox,
    }));

    

    setSelectedFox(fox);
  };

  const handleCloseModal = () => {
    setSelectedFox(null);
  };

  const handleUnstake = async () => {
    console.log('Unstake', selectedFox);
    await unstakeTransaction(selectedFox.asset_id);
  };

  const handleClaimTaxes = async (assetId) => {
    try {
      const { accountName } = activeUser;
      let { requestPermission } = activeUser;
      if (!requestPermission && activeUser.scatter) {
        // workaround for scatter
        requestPermission = activeUser.scatter.identity.accounts[0].authority;
      }

      const actions = [
        {
          account: 'dcycmissions',
          name: 'collecttax',
          authorization: [
            {
              actor: accountName,
              permission: requestPermission,
            },
          ],
          data: {
            owner: accountName,
            asset_id: assetId,
            fox_weapon_id: 0, // it will always be 0 for now
          },
        },
      ];

      console.log('Signing transaction with actions:', actions);

      const result = await activeUser.signTransaction(
        { actions },
        {
          blocksBehind: 3,
          expireSeconds: 120,
        }
      );

      console.log('Transaction result:', result);
      alert('Transaction successful');
    } catch (error) {
      console.error('Error signing transaction:', error);
      alert('Failed to claim taxes');
    }
  };

  const handleClaim = async (assetId, stolenNFT) => {
    try {
      const { accountName } = activeUser;
      let { requestPermission } = activeUser;
      if (!requestPermission && activeUser.scatter) {
        requestPermission = activeUser.scatter.identity.accounts[0].authority;
      }

      const actions = [
        {
          account: 'dcycstealing',
          name: 'claimstolen',
          authorization: [
            {
              actor: accountName,
              permission: requestPermission,
            },
          ],
          data: {
            owner: accountName,
            pool_name: 'dcycthiefnft',
            index: stolenNFT.index,
            nft: assetId,  // using assetId
          },
        },
      ];

      console.log('Signing transaction with actions:', actions);

      const result = await activeUser.signTransaction(
        { actions },
        {
          blocksBehind: 3,
          expireSeconds: 120,
        }
      );

      console.log('Transaction result:', result);
      alert('Transaction successful');
      fetchStolenNFTs();
    } catch (error) {
      console.error('Error signing transaction:', error);
      alert('Failed to claim stolen NFT');
    }
  };
  

  const unstakeTransaction = async (assetId) => {
    try {
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
          name: "unstake",
          authorization: [
            {
              actor: accountName,
              permission: requestPermission,
            }
          ],
          data: {
            owner: accountName,
            asset_id: assetId,
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
    <div>
{Array.isArray(foxes) &&
    foxes
    .filter(fox => fox.schema.schema_name === 'foxworkingv1')
    .map(fox => (
        <div key={fox.asset_id} className="fox-item">
        <p>{fox.name}</p>
        <div className="fox-image-container">
            <img
            src={`${ipfsUrl}/${fox.data.img}`}
            alt={fox.name}
            className="fox-image"
            onClick={() => handleClick(fox)}
            />
            {claimableNFTCounts[fox.asset_id] > 0 && (
            <div className="claimable-count">
                {claimableNFTCounts[fox.asset_id]}
            </div>
            )}
        </div>
        </div>
    ))}
      {selectedFox && (
        <FoxModal
        fox={selectedFox}
        onClose={handleCloseModal}
        onUnstake={handleUnstake}
        onClaim={handleClaim}
        onClaimTaxes={handleClaimTaxes} // pass the handleClaimTaxes function as a prop
        claimableStolenNFTs={claimableStolenNFTs}
        ipfsUrl={ipfsUrl}
      />
    )}
  </div>
);
};

export default Foxes;
