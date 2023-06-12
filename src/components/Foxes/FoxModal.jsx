import React from 'react';
import './FoxModal.css';

const FoxModal = ({ fox, onClose, onUnstake, onClaim, onClaimTaxes, claimableStolenNFTs, ipfsUrl }) => {
  const claimableForFox = claimableStolenNFTs[fox.asset_id] || [];

  return (
    <div className="fox-modal">
      <div className="fox-modal-content">
        <button onClick={onClose} className="close-button">X</button>
        <h3>{fox.name}</h3>
        <img
          src={`${ipfsUrl}/${fox.data.img}`}
          alt={fox.name}
          className="fox-image-modal"
        />
        <div className="buttons-container">
          <button onClick={onUnstake} className="unstake-button">Unstake</button>
          {claimableForFox.length > 0 && (
            <button onClick={() => onClaim(fox.asset_id, claimableForFox[0])} className="claim-button">
              Claim Stolen NFT
            </button>
          )}
          <button onClick={() => onClaimTaxes(fox.asset_id)} className="claim-taxes-button">
            Claim Taxes
          </button>
        </div>
        <h4>Claimable Stolen NFTs</h4>
        <ul>
          {claimableForFox.map((nft, i) => (
            <li key={i}>
              Index: {nft.index} - Start Weight: {nft.start_weight} - End Weight: {nft.end_weight}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FoxModal;
