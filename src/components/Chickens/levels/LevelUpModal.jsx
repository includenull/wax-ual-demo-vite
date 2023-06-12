import React, { useState } from 'react';
import { RpcError } from 'eosjs';
import SkipLevelModal from './SkipLevelModal';

const LevelUpModal = ({ chicken, filteredLevels, onLevelUp, onCancel, activeUser }) => {
  const [sliderValue, setSliderValue] = useState(chicken?.mutable_data?.level);
  const [showSkipLevelModal, setShowSkipLevelModal] = useState(false);

  const handleSliderChange = (e) => {
    setSliderValue(parseInt(e.target.value));
  };

  const handleLevelUp = async () => {
    try {
      let selectedLevelIds = [];

      if (sliderValue >= chicken?.mutable_data?.level) {
        selectedLevelIds = filteredLevels
          .filter((level) => level.level_requirement >= chicken?.mutable_data?.level && level.level_requirement <= sliderValue)
          .map((level) => level.level_up_id);
      }

      const data = {
        owner: activeUser.accountName,
        asset_id: chicken.asset_id,
        level_up_ids: selectedLevelIds,
      };

      const transaction = await activeUser.signTransaction(
        {
          actions: [
            {
              account: 'dcycmissions',
              name: 'queuelvlup',
              authorization: [
                {
                  actor: activeUser.accountName,
                  permission: activeUser.requestPermission,
                },
              ],
              data,
            },
          ],
        },
        {
          blocksBehind: 3,
          expireSeconds: 120,
          broadcast: true,
        }
      );

      console.log('Transaction response:', transaction);
      alert('Transaction ID: ' + transaction?.transactionId);
    } catch (error) {
      alert(error.toString());
      console.error('Error sending transaction:', error);
      if (error instanceof RpcError) {
        console.log(JSON.stringify(error.json, null, 2));
      }
    }
  };

  const handleClaimLevelUp = async () => {
    try {
      const data = {
        owner: activeUser.accountName,
        asset_id: chicken.asset_id,
      };

      const transaction = await activeUser.signTransaction(
        {
          actions: [
            {
              account: 'dcycmissions',
              name: 'claimlvlup',
              authorization: [
                {
                  actor: activeUser.accountName,
                  permission: activeUser.requestPermission,
                },
              ],
              data,
            },
          ],
        },
        {
          blocksBehind: 3,
          expireSeconds: 120,
          broadcast: true,
        }
      );

      console.log('Claim Level Up Transaction response:', transaction);
      alert('Claim Level Up Transaction ID: ' + transaction?.transactionId);
    } catch (error) {
      alert(error.toString());
      console.error('Error sending transaction:', error);
      if (error instanceof RpcError) {
        console.log(JSON.stringify(error.json, null, 2));
      }
    }
  };

  const handleToggleSkipLevelModal = () => {
    setShowSkipLevelModal(!showSkipLevelModal);
  };

  return (
    <div className="level-up-modal">
      <h3>Level Up Modal</h3>
      <div>
        <span>Current Level: {chicken?.mutable_data?.level}</span>
        {filteredLevels && (
          <>
            <input
              type="range"
              min={chicken?.mutable_data?.level}
              max={filteredLevels[filteredLevels.length - 1]?.level_requirement || 200}
              value={sliderValue}
              onChange={handleSliderChange}
            />
            <span>Selected Levels: {sliderValue - chicken?.mutable_data?.level}</span>
          </>
        )}
      </div>
      <button onClick={handleLevelUp}>Queue Level Up</button>
      <button onClick={handleClaimLevelUp}>Claim Level Up</button>
      <button onClick={onCancel}>Cancel</button>

      <button onClick={handleToggleSkipLevelModal}>Switch to Skip Level</button>

      {showSkipLevelModal && (
  <SkipLevelModal
    chicken={chicken}
    onSkipLevel={async (assetId, level) => {
      try {
        // Get the level IDs from the chicken's level_queue.
        // We use slice to only take the number of levels the user has selected with the slider.
        const queueLevels = chicken.mutable_data.level_queue.slice(0, level);
    
        // Map queue levels to their corresponding level_up_ids in the fetched levels data.
        const level_up_id = queueLevels.map(queueLevel => {
          const levelData = filteredLevels.find(level => level.new_level == queueLevel);
          return levelData ? levelData.level_up_id : null;
        }).filter(id => id !== null);  // Filter out any null values.
    
        if (level_up_id.length > 0) {
          console.log('Attempting to skip levels:', level_up_id);
          const data = {
            owner: activeUser.accountName,
            asset_id: assetId,
            level_up_id
          };

          console.log('Data being sent to the blockchain:', data);  // Add this line.

    
          const transaction = await activeUser.signTransaction(
            {
              actions: [
                {
                  account: 'dcycmissions',
                  name: 'skiplvlup',
                  authorization: [
                    {
                      actor: activeUser.accountName,
                      permission: activeUser.requestPermission,
                    },
                  ],
                  data,
                },
              ],
            },
            {
              blocksBehind: 3,
              expireSeconds: 120,
              broadcast: true,
            }
          );
    
          console.log('Transaction response:', transaction);
          alert('Transaction ID: ' + transaction?.transactionId);
        } else {
          console.log('No valid level_up_ids found for the selected levels');
        }
      } catch (error) {
        console.error('Error skipping levels:', error);
      }
    }}
    
    onCancel={handleToggleSkipLevelModal}
  />
)}
    </div>
  );
};

export default LevelUpModal;
