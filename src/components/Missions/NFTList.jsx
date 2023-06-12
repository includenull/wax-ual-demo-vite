import React from 'react';
import { GetNFTStatus } from "./Helpers/GetNFTData";

const NFTList = ({ nfts, selectedNFTs, setSelectedNFTs, missions, ipfsUrl }) => {
  console.log('nfts', nfts); // Log the nfts prop
  console.log('selectedNFTs', selectedNFTs); // Log the selectedNFTs prop
  console.log('missions', missions); // Log the missions prop

  const toggleSelectedNFT = (nft) => {
    const isSelected = selectedNFTs.some(selected => selected.index === nft.index);
    if (isSelected) {
      setSelectedNFTs(selectedNFTs.filter((selected) => selected.index !== nft.index));
    } else {
      if (selectedNFTs.length < 40) {
        const hasWeapon = nft.weaponData;
        const templateIds = nft.assetData.nftData.map(item => item.template_id);
        const levels = nft.assetData.nftData.map(item => item.level);
        setSelectedNFTs([...selectedNFTs, { ...nft, hasWeapon, templateIds, levels }]);
      } else {
        alert('You can only select up to 40 NFTs.');
      }
    }
  };
  

  const selectUpTo40NFTs = () => {
    if (selectedNFTs.length > 0) {
      setSelectedNFTs([]); // Deselect all if any are selected
    } else {
      const selectableNFTs = nfts.filter(nft => GetNFTStatus(nft, missions) === 'available');
      setSelectedNFTs(selectableNFTs.slice(0, 40)); // Select up to 40 NFTs
    }
  };

  return (
    <div>
      <h2>Your NFTs</h2>
      <div className="nft-list">
        <button onClick={selectUpTo40NFTs}>Select 40</button>
        {nfts.map((nft) => {
          const status = GetNFTStatus(nft, missions);
          const isSelected = selectedNFTs.some(selected => selected.index === nft.index);
          const className = `nft ${status} ${isSelected ? 'selected' : ''}`;
          const hasWeapon = nft.weaponData;
  
          return (
            <div
              key={nft.index}
              className={className}
              onClick={() => toggleSelectedNFT(nft)}
            >
              <img
                src={`${ipfsUrl}/${nft.assetData.data.img}`}
                alt={nft.assetData.name}
                width="100"
              />
              <div className="nft-info">
                <p>{`ID: ${nft.index}`}</p>
                <p>{`Level: ${nft.level}`}</p>
                <p>{`Status: ${status}`}</p>
                <p>{`Completed Missions: ${nft.completedMissionsCount}`}</p>
                {hasWeapon && (
                  <>
                    <p>Weapon Attached: Yes</p>
                    <p>Weapon Template ID: {nft.weaponData.template.template_id}</p>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NFTList;
