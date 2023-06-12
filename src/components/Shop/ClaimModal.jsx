// ClaimModal.js
import React from "react";

const ClaimModal = ({ isOpen, handleClose, handleClaim, currentListing, latestNft, skippedSteal }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Claim Items</h3>
        {currentListing && (
          <>
            <h4>Listing Details</h4>
            <img src={currentListing.imgUrl} alt={currentListing.collection_name} />
            <p>{currentListing.collection_name}</p>
          </>
        )}
        {latestNft && (
          <>
            <h4>Your Latest NFT</h4>
            <img src={latestNft.imageUrl} alt={latestNft.collectionName} />
            <p>{latestNft.collectionName}</p>
          </>
        )}
        {skippedSteal !== null && (
          <p>Skipped Steal Status: {skippedSteal ? "True" : "False"}</p>
        )}
        <button onClick={handleClaim}>Claim</button>
        <button onClick={handleClose}>Cancel</button>
      </div>
    </div>
  );
};

export default ClaimModal;
