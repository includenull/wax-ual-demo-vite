import React, { useEffect, useState } from 'react';
import { UALContext } from 'ual-reactjs-renderer';
import { ExplorerApi } from 'atomicassets';
import './StakeNFTs.css';
import { deserialize, ObjectSchema } from 'atomicassets';

const nftSchema = ObjectSchema([
  { name: 'name', type: 'string' },
  { name: 'img', type: 'string' },
  { name: 'video', type: 'string' },
  { name: 'level', type: 'uint32' },
  { name: 'upgrade_available_at', type: 'uint32' },
  { name: 'weight', type: 'uint32' },
  { name: 'level_queue', type: 'uint64[]' },
  { name: 'durability', type: 'uint32' },
]);

const StakeNFTs = ({ rpc, ipfsUrl, apiUrl }) => {
  const [nfts, setNfts] = useState([]);
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [schemaFilter, setSchemaFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [rarityFilter, setRarityFilter] = useState('');
  const { activeUser } = React.useContext(UALContext);
  const explorerApi = new ExplorerApi(apiUrl, 'atomicassets', { fetch: fetch.bind(window) });

  useEffect(() => {
    if (activeUser) {
      const fetchNFTs = async () => {
        const assetsResult = await rpc.get_table_rows({
          code: 'atomicassets',
          scope: activeUser.accountName,
          table: 'assets',
          limit: 1000,
        });

        console.log('Assets Result:', assetsResult);

        const userAssets = assetsResult.rows;

        console.log('User Assets:', userAssets);

        const assetPromises = userAssets.map(async (asset) => {
          const fetchedAsset = await explorerApi.getAsset(asset.asset_id);
          console.log('Fetched Asset:', fetchedAsset); // Log the fetched asset
          return { ...fetchedAsset, data: { ...fetchedAsset.data, ...fetchedAsset.mutable_data } };
        });

        const nfts = await Promise.all(assetPromises);

        console.log('NFTs:', nfts);

        setNfts(nfts);
      };

      fetchNFTs();
    }
  }, [activeUser]);

  const handleClick = (nft) => {
    if (selectedNFTs.includes(nft)) {
      setSelectedNFTs(selectedNFTs.filter((item) => item !== nft));
    } else if (selectedNFTs.length < 40) {
      setSelectedNFTs([...selectedNFTs, nft]);
    }
  };

  const handleStake = async () => {
    if (    selectedNFTs.length === 0) return;

    const { accountName } = activeUser;
    let { requestPermission } = activeUser;
    if (!requestPermission && activeUser.scatter) {
      requestPermission = activeUser.scatter.identity.accounts[0].authority;
    }

    const assetIds = selectedNFTs.map((nft) => nft.asset_id);

    try {
      const transaction = await activeUser.signTransaction(
        {
          actions: [
            {
              account: 'atomicassets',
              name: 'transfer',
              authorization: [
                {
                  actor: accountName,
                  permission: requestPermission,
                },
              ],
              data: {
                from: accountName,
                to: 'dcycmissions',
                asset_ids: assetIds,
                memo: 'stake',
              },
            },
          ],
        },
        {
          blocksBehind: 3,
          expireSeconds: 120,
          broadcast: true,
        }
      );
      console.log(transaction);
      alert('Transaction ID: ' + transaction?.transactionId);
      setSelectedNFTs([]);
    } catch (e) {
      alert(e.toString());
      console.error(e);
    }
  };

  const handleStakeTopN = async (n) => {
    const topNFTs = nfts.slice(0, n);
    setSelectedNFTs(topNFTs);
    await handleStake();
  };

  const filteredNFTs = nfts.filter((nft) => {
    const schemaMatch = !schemaFilter || nft.collection_name === schemaFilter;
    const levelMatch = !levelFilter || nft.data.level === parseInt(levelFilter);
    const classMatch = !classFilter || nft.data.class === classFilter;
    const rarityMatch = !rarityFilter || nft.data.rarity === rarityFilter;

    return schemaMatch && levelMatch && classMatch && rarityMatch;
  });

  return (
    <div>
      <div className="filters">
        <label>
          Schema:
          <input type="text" value={schemaFilter} onChange={(e) => setSchemaFilter(e.target.value)} />
        </label>
        <label>
          Level:
          <input type="number" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} />
        </label>
        <label>
          Class:
          <input type="text" value={classFilter} onChange={(e) => setClassFilter(e.target.value)} />
        </label>
        <label>
          Rarity:
          <input type="text" value={rarityFilter} onChange={(e) => setRarityFilter(e.target.value)} />
        </label>
      </div>
      <div className="nft-grid">
        {Array.isArray(filteredNFTs) &&
          filteredNFTs.map((nft) => (
            <div
              key={nft.asset_id}
              className={`nft ${selectedNFTs.includes(nft) ? 'selected' : ''}`}
              onClick={() => handleClick(nft)}
            >
              <p>{nft.name}</p>
              <img src={`${ipfsUrl}/${nft.data.img}`} alt={nft.name} className="nft-image" />
            </div>
          ))}
      </div>
      <button onClick={handleStake}>Stake Selected NFTs</button>
      <button onClick={() => handleStakeTopN(40)}>Stake Top 40 NFTs</button>
    </div>
  );
};

export default StakeNFTs;

