import React from 'react';
import { UALContext } from 'ual-reactjs-renderer';
import { ExplorerApi } from 'atomicassets';
import { useEffect, useState } from 'react';
import './Chickens.css';
import ChickenModal from './ChickenModal';
import { RpcError } from 'eosjs';


const Chickens = ({ rpc, ipfsUrl, apiUrl }) => {
  const [chickens, setChickens] = useState([]);
  const [selectedChicken, setSelectedChicken] = useState(null);
  const [highlightedChickens, setHighlightedChickens] = useState([]);
  const [filterAttribute, setFilterAttribute] = useState('level');
  const { activeUser } = React.useContext(UALContext);
  const explorerApi = new ExplorerApi(apiUrl, 'atomicassets', { fetch: fetch.bind(window) });
  const [userMissions, setUserMissions] = useState([]);
  const [filterValue, setFilterValue] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterRarity, setFilterRarity] = useState('');
  const maxLevel = 200;

useEffect(() => {
  const getUserMissions = async () => {
    const userMissionsResult = await rpc.get_table_rows({
      code: 'dcycmissions',
      scope: activeUser.accountName,
      table: 'usermissions',
      limit: 1000,
    });

    setUserMissions(userMissionsResult.rows);
  };

  getUserMissions();
}, [activeUser]);

const isChickenBusy = (chickenId) => {
  // Check if any user mission has the chickenId in its asset_ids array
  return userMissions.some((mission) => mission.asset_ids.includes(chickenId));
};

useEffect(() => {
  const getStakedNFTs = async () => {
    const stakedResult = await rpc.get_table_rows({
      code: 'dcycmissions',
      scope: activeUser.accountName,
      table: 'staked',
      limit: 1000,
    });

    console.log('Staked assets:', stakedResult.rows);
    
    const stakedAssets = stakedResult.rows.map(row => row.asset_id);
    
    const assetPromises = stakedAssets.map(async (asset_id) => {
      const asset = await explorerApi.getAsset(asset_id);
      return asset;
    });
    
    const chickens = await Promise.all(assetPromises);
    
    console.log('Chickens:', chickens);
    setChickens(chickens);
  };
    
  getStakedNFTs();
}, [activeUser, filterLevel, filterClass, filterRarity]);

  const handleClick = (chicken) => {
    setSelectedChicken(chicken);
  };

  const handleCloseModal = () => {
    setSelectedChicken(null);
  };

  const handleLevelUp = () => {
    console.log('Level Up', selectedChicken);
  };

  const handleUnstake = async () => {
    console.log('Unstake', selectedChicken);
    await unstakeTransaction(selectedChicken.asset_id);
  };

  const handleStartModal = async () => {
    console.log('Start', selectedChicken);
    await missionStartTransaction([selectedChicken.asset_id]);
  };

  const handleStartOutsideModal = async () => {
    console.log('Start', highlightedChickens);
    await missionStartTransaction(highlightedChickens.map(chicken => chicken.asset_id));
  };

  const handleSelect40 = () => {
    const limit = 40;
    const nonBusyChickens = filteredChickens.filter((chicken) => !isChickenBusy(chicken.asset_id));
    setHighlightedChickens(nonBusyChickens.slice(0, limit));
  };

  const handleChangeFilterAttribute = (attribute, value) => {
    if (attribute === 'level') {
      setFilterLevel(value);
    } else if (attribute === 'class') {
      setFilterClass(value);
    } else if (attribute === 'rarity') {
      setFilterRarity(value);
    }
  };
  
  const handleFilterValueChange = (value) => {
    setFilterValue(value);
  };

  const increaseFilterLevel = () => {
    const currentValue = parseInt(filterLevel);
    if (isNaN(currentValue)) {
      handleChangeFilterAttribute('level', '0');
    } else if (currentValue < maxLevel) {
      handleChangeFilterAttribute('level', (currentValue + 1).toString());
    }
  };
  
  const decreaseFilterLevel = () => {
    const currentValue = parseInt(filterLevel);
    if (currentValue === 0) {
      handleChangeFilterAttribute('level', '');
    } else if (currentValue > 0) {
      handleChangeFilterAttribute('level', (currentValue - 1).toString());
    }
  };
  
  const classOptions = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
  const rarityOptions = ["Uncommon", "Rare", "Epic", "Legendary", "Mythic"];
  
  const increaseFilterClass = () => {
    const currentIndex = classOptions.indexOf(filterClass);
    if (currentIndex < classOptions.length - 1) {
      handleChangeFilterAttribute("class", classOptions[currentIndex + 1]);
    }
  };
  
  const decreaseFilterClass = () => {
    const currentIndex = classOptions.indexOf(filterClass);
    if (currentIndex === 0) {
      handleChangeFilterAttribute('class', '');
    } else if (currentIndex > 0) {
      handleChangeFilterAttribute('class', classOptions[currentIndex - 1]);
    }
  };
  
  const increaseFilterRarity = () => {
    const currentIndex = rarityOptions.indexOf(filterRarity);
    if (currentIndex < rarityOptions.length - 1) {
      handleChangeFilterAttribute("rarity", rarityOptions[currentIndex + 1]);
    }
  };
  
  const decreaseFilterRarity = () => {
    const currentIndex = rarityOptions.indexOf(filterRarity);
    if (currentIndex === 0) {
      handleChangeFilterAttribute('rarity', '');
    } else if (currentIndex > 0) {
      handleChangeFilterAttribute('rarity', rarityOptions[currentIndex - 1]);
    }
  };

  
  const handleHighlightChicken = (chicken) => {
    if (isChickenBusy(chicken.asset_id)) return;
    const limit = 40;
    let newHighlightedChickens = [...highlightedChickens];
  
    if (newHighlightedChickens.includes(chicken)) {
      newHighlightedChickens = newHighlightedChickens.filter(
        (item) => item !== chicken
      );
    } else {
      if (newHighlightedChickens.length >= limit) {
        newHighlightedChickens.shift();
      }
      newHighlightedChickens.push(chicken);
    }
  
    console.log('Highlighted Chickens:', newHighlightedChickens);
    setHighlightedChickens(newHighlightedChickens);
  };
  
  const clearSelectedChickens = () => {
    setHighlightedChickens([]);
  };

  const missionStartTransaction = async (assetIds) => {
    try {
      const { accountName } = activeUser;
      let { requestPermission } = activeUser;
      if (!requestPermission && activeUser.scatter) {
        // workaround for scatter
        requestPermission = activeUser.scatter.identity.accounts[0].authority;
      }
  
      // submit the transaction
      const actions = assetIds.map(assetId => ({
        account: "dcycmissions",
        name: "missionstart",
        authorization: [
          {
            actor: accountName,
            permission: requestPermission,
          },
        ],
        data: {
          owner: accountName,
          asset_ids: [assetId],
        },
      }));
  
      const transaction = await activeUser.signTransaction({ actions }, {
        blocksBehind: 3,
        expireSeconds: 120,
        broadcast: true,
      });
  
      console.log(transaction);
      alert("Transaction ID: " + transaction?.transactionId);
    } catch (e) {
      alert(e.toString());
      console.error(e.message, e.stack);
      if (e instanceof RpcError) console.log(JSON.stringify(e.json, null, 2));
    }
  };
  
  const levelOptions = Array.from({ length: 201 }, (_, i) => i);

  const filteredChickens = chickens
  .filter((chicken) => chicken.schema.schema_name === 'chickens1222')
  .map((chicken) => {
    if (!chicken.data.class) {
      chicken.data.class = 1;
    }
    return chicken;
  })
  .filter((chicken) => {
    const levelFilter = filterLevel ? chicken.data.level <= filterLevel : true;
    const classFilter = filterClass ? chicken.data.class == filterClass : true;
    const rarityFilter = filterRarity ? chicken.data.rarity === filterRarity : true;
    
    return levelFilter && classFilter && rarityFilter;
    
  })
  .sort((a, b) => {
    const aIsBusy = isChickenBusy(a.asset_id);
    const bIsBusy = isChickenBusy(b.asset_id);

    if (aIsBusy && !bIsBusy) return 1;
    if (!aIsBusy && bIsBusy) return -1;

    if (!filterAttribute || !filterValue) {
      return a.minted_at - b.minted_at;
    }

    return b.data[filterAttribute] - a.data[filterAttribute];
  });

  return (
    <div>
      {/* ...other elements */}
      <div className="filter-selector">
        <div className="filter-option">
          <label htmlFor="filter-level">Level</label>
          <select
            id="filter-level"
            value={filterLevel}
            onChange={(e) => handleChangeFilterAttribute('level', e.target.value)}
          >
            <option value="">Level</option>
            {levelOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <div className="filter-arrows">
            <button onClick={(e) => { e.stopPropagation(); increaseFilterLevel(); }}>&#8593;</button>
            <button onClick={(e) => { e.stopPropagation(); decreaseFilterLevel(); }}>&#8595;</button>
          </div>
        </div>
        <div className="filter-option">
          <label htmlFor="filter-class">Class</label>
          <select
            id="filter-class"
            value={filterClass}
            onChange={(e) => handleChangeFilterAttribute('class', e.target.value)}
          >
            <option value="">Class</option>
            {classOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <div className="filter-arrows">
            <button onClick={(e) => { e.stopPropagation(); increaseFilterClass(); }}>&#8593;</button>
            <button onClick={(e) => { e.stopPropagation(); decreaseFilterClass(); }}>&#8595;</button>
          </div>
        </div>
        <div className="filter-option">
          <label htmlFor="filter-rarity">Rarity</label>
          <select
            id="filter-rarity"
            value={filterRarity}
            onChange={(e) => handleChangeFilterAttribute('rarity', e.target.value)}
          >
            <option value="">Rarity</option>
            {rarityOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <div className="filter-arrows">
            <button onClick={(e) => { e.stopPropagation(); increaseFilterRarity(); }}>&#8593;</button>
            <button onClick={(e) => { e.stopPropagation(); decreaseFilterRarity(); }}>&#8595;</button>
          </div>
        </div>
      </div>
      <button onClick={handleSelect40}>Select 40</button>
      <button onClick={handleStartOutsideModal}>Start</button>
      <button onClick={clearSelectedChickens}>Clear Selection</button>
      <div className="chickens-container">
  {filteredChickens.map((chicken) => {
    const isBusy = isChickenBusy(chicken.asset_id);
    const imgUrl = `${ipfsUrl}/${chicken.data.img}`;

    return (
      <div
        key={chicken.asset_id}
        className={`chicken-item ${
          highlightedChickens.includes(chicken) ? 'highlighted' : ''
        } ${isBusy ? 'busy' : ''}`}
        onClick={() => handleHighlightChicken(chicken)}
      >
        {isBusy && (
          <div className={`busy-icon ${isBusy ? 'visible' : ''}`}>
            &#10003;
          </div>
        )}
        <img src={imgUrl} alt="chicken" className="chicken-image" />
        <button className="details-button" onClick={() => handleClick(chicken)}>
          Details
        </button>
      </div>
    );
    })}
  </div>;
      {selectedChicken && (
        <ChickenModal
    chicken={selectedChicken}
    onClose={handleCloseModal}
    onStart={handleStartModal}
    onLevelUp={handleLevelUp}
    onUnstake={handleUnstake}
    rpc={rpc}
    apiUrl={apiUrl}
    ipfsUrl={ipfsUrl}
    busy={isChickenBusy(selectedChicken)}
    activeUser={activeUser}
  />
)}
    </div>
  );
};

export default Chickens;
