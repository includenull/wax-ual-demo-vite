import React from 'react';

const NFTActions = ({
  selectedNFTs,
  selectedDirection,
  onSendMission,
  onCancelMission,
  onAbortMission,
  onCompleteMission, // Use this prop
  onClaimMission,
}) => {
  return (
    <div className="nft-actions">
      <button onClick={onSendMission}>Send on mission</button>
      <button onClick={() => onCancelMission(selectedNFTs)}>Cancel</button>
      <button onClick={() => onAbortMission(selectedNFTs)}>Abort</button>
      <button onClick={onCompleteMission}>Complete</button> {/* Update this line */}
      <button onClick={() => onClaimMission(selectedNFTs)}>Claim</button>
    </div>
  );
};

export default NFTActions;
