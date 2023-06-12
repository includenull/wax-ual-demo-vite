import React, { useState, useEffect } from 'react';
import './ChickenModal.css';
import { useWeapons } from './weapons-fetch/fetchweapons';
import { RpcError } from 'eosjs';
import { fetchLevels } from './levels/dcycmissions';
import LevelUpModal from './levels/LevelUpModal';
import SkipLevelModal from './levels/SkipLevelModal';

const ChickenModal = ({
  chicken,
  onClose,
  onStart,
  onUnstake,
  ipfsUrl,
  busy,
  rpc,
  apiUrl,
  activeUser,
}) => {
  const [selectedWeapon, setSelectedWeapon] = useState(null);
  const [showWeaponSelection, setShowWeaponSelection] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(false);
  const [levels, setLevels] = useState([]);
  const [levelUpModalOpen, setLevelUpModalOpen] = useState(false);
  const [skipLevelModalOpen, setSkipLevelModalOpen] = useState(false);
  const [selectedLevels, setSelectedLevels] = useState(0);
  const [filteredLevels, setFilteredLevels] = useState([]);
  const [levelQueue, setLevelQueue] = useState([]);
  const [skipLevels, setSkipLevels] = useState(0);



  const weapons = useWeapons(rpc, apiUrl, shouldFetch, activeUser) || [];

  const handleClickOutside = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  
  const handleAttachWeapon = () => {
    setShowWeaponSelection(!showWeaponSelection);
    setShouldFetch(true);
  };

  const handleWeaponSelection = (weapon) => {
    // Deselect any previously selected weapon
    const previousSelectedWeapon = document.querySelector('.weapon-image-small.selected');
    if (previousSelectedWeapon) {
      previousSelectedWeapon.classList.remove('selected');
    }

    // Select the current weapon
    const currentWeaponElement = document.getElementById(`weapon-${weapon.asset_id}`);
    if (currentWeaponElement) {
      currentWeaponElement.classList.add('selected');
    }
    setSelectedWeapon(weapon);
  };

  const handleSendWithWeapon = async () => {
    if (selectedWeapon) {
      try {
        const { accountName } = activeUser;
        let { requestPermission } = activeUser;
        if (!requestPermission && activeUser.scatter) {
          // workaround for scatter
          requestPermission = activeUser.scatter.identity.accounts[0].authority;
        }

        // Prepare the transaction data
        const transactionData = {
          actions: [
            {
              account: 'dcycmissions',
              name: 'missionstart',
              authorization: [
                {
                  actor: accountName,
                  permission: requestPermission,
                },
              ],
              data: {
                owner: accountName,
                asset_ids: [chicken.asset_id, selectedWeapon.asset_id],
              },
            },
          ],
        };

        console.log('Transaction data:', transactionData);

        // submit the transaction
        const transaction = await activeUser.signTransaction(transactionData, {
          blocksBehind: 3,
          expireSeconds: 120,
          broadcast: true,
        });
        console.log('Transaction response:', transaction);
        alert('Transaction ID: ' + transaction?.transactionId);
      } catch (e) {
        alert(e.toString());
        console.error(e);
        if (e instanceof RpcError) console.log(JSON.stringify(e.json, null, 2));
      }
    } else {
      alert('Please select a weapon before sending.');
    }
  };

  const handleLevelUpModalOpen = async () => {
    const templateId = chicken?.template?.template_id;
    console.log('Template ID:', templateId);
  
    if (templateId) {
      console.log('Fetching levels...');
      const levels = await fetchLevels(rpc);
      console.log('Levels:', levels);
  
      const filteredLevels = levels.filter(level => level.template_id === parseInt(templateId));
      console.log('Filtered Levels:', filteredLevels);
  
      setFilteredLevels(filteredLevels);
      setLevelUpModalOpen(true);
    } else {
      console.log('Unable to retrieve template ID.');
    }
  };
  

  const handleLevelUpModalClose = () => {
    setLevelUpModalOpen(false);
  };

  const handleLevelUp = () => {
    console.log('Performing level up with selected levels:', selectedLevels);

    // Perform the level up action using the selected levels
    // Here, you can implement the logic to perform the level up action using the selectedLevels state variable
    // You can call the onLevelUp function or perform any other necessary actions
    // Example:
    // onLevelUp(chicken.asset_id, selectedLevels);

    // Close the level up modal
    handleLevelUpModalClose();
  };

  const handleSkipLevelModalOpen = () => {
    setSkipLevelModalOpen(true);
  };

  const handleSkipLevelModalClose = () => {
    setSkipLevelModalOpen(false);
  };

  const handleSkipLevel = async (chickenId, levelsToSkip) => {
    if (levelsToSkip > 0) {
      try {
        const { accountName } = activeUser;
        let { requestPermission } = activeUser;
        if (!requestPermission && activeUser.scatter) {
          // workaround for scatter
          requestPermission = activeUser.scatter.identity.accounts[0].authority;
        }
  
        // Prepare the transaction data
        const transactionData = {
          actions: [
            {
              account: 'dcycmissions',
              name: 'skiplvlup',
              authorization: [
                {
                  actor: accountName,
                  permission: requestPermission,
                },
              ],
              data: {
                owner: accountName,
                chicken_id: chickenId,
                skip_levels: levelsToSkip,
              },
            },
          ],
        };
  
        console.log('Transaction data:', transactionData);
  
        // submit the transaction
        const transaction = await activeUser.signTransaction(transactionData, {
          blocksBehind: 3,
          expireSeconds: 120,
          broadcast: true,
        });
        console.log('Transaction response:', transaction);
        alert('Transaction ID: ' + transaction?.transactionId);
      } catch (e) {
        alert(e.toString());
        console.error(e);
        if (e instanceof RpcError) console.log(JSON.stringify(e.json, null, 2));
      }
    } else {
      alert('Please select levels to skip.');
    }
  
    // Close the skip level modal
    handleSkipLevelModalClose();
  };


  useEffect(() => {
    const fetchLevelsData = async () => {
      console.log('Fetching levels...');
      try {
        const templateId = chicken?.data?.template?.template_id;
        const currentLevel = chicken?.mutable_data?.level; // Access the level from mutable_data
        console.log('Current Level:', currentLevel); // Log the current level
        const levelQueueData = chicken?.mutable_data?.level_queue; // Access the level_queue data
        console.log('Level Queue Data:', levelQueueData); // Log the level_queue data
        setLevelQueue(levelQueueData); // Set the level_queue data
        if (templateId) {
          const levelsData = await fetchLevels(rpc, templateId);
          console.log('Filtered Levels:', levelsData);
          setFilteredLevels(levelsData);
        } else {
          console.log('Unable to retrieve template ID.');
          setFilteredLevels([]);
        }
      } catch (error) {
        console.error('Error fetching levels:', error);
        setFilteredLevels([]);
      }
    };
    fetchLevelsData();
  }, [rpc, chicken]);
  

  console.log('Chicken:', chicken);
  console.log('Weapons:', weapons);
  console.log('Levels:', levels);
  console.log('Filtered Levels:', filteredLevels);

  return (
    <div className="chicken-modal" onClick={handleClickOutside}>
      <div className="chicken-modal-content">
        <button onClick={onClose} className="close-button">
          X
        </button>
        <h3>{chicken.name}</h3>
        <img
          src={`${ipfsUrl}/${chicken.data.img}`}
          alt={chicken.name}
          className="chicken-image-modal"
        />
        <div className="buttons-container">
          {!busy && (
            <>
              <button onClick={handleAttachWeapon} className="attach-weapon-button">
                Attach Weapon
              </button>
              <button onClick={onStart} className="start-button">
                Start
              </button>
              <button onClick={handleLevelUpModalOpen} className="level-up-button">
                Level Up
              </button>
              <button onClick={onUnstake} className="unstake-button">
                Unstake
              </button>
            </>
          )}
          {busy && (
            <button onClick={handleCancel} className="cancel-button">
              Cancel
            </button>
          )}
          {selectedWeapon && (
            <button onClick={handleSendWithWeapon} className="send-with-weapon-button">
              Send
            </button>
          )}
        </div>
      </div>
      {showWeaponSelection && (
        <div className="weapon-selection">
          {weapons.map((weapon) => (
            <div
              key={weapon.asset_id}
              className={`weapon ${
                selectedWeapon && selectedWeapon.asset_id === weapon.asset_id
                  ? 'highlighted'
                  : ''
              }`}
              onClick={() => handleWeaponSelection(weapon)}
            >
              <img
                id={`weapon-${weapon.asset_id}`}
                src={`${ipfsUrl}/${weapon.data.img}`}
                alt={weapon.name}
                className={`weapon-image-small ${
                  selectedWeapon && selectedWeapon.asset_id === weapon.asset_id
                    ? 'selected'
                    : ''
                }`}
              />
            </div>
          ))}
          <button onClick={handleSendWithWeapon} className="send-with-weapon-button">
            Send
          </button>
        </div>
      )}
{levelUpModalOpen && (
  <LevelUpModal
  chicken={chicken}
  filteredLevels={filteredLevels}
  selectedLevels={selectedLevels}
  onLevelUp={handleLevelUp}
  onCancel={handleLevelUpModalClose}
  currentLevel={chicken.level} // Add the current level as a prop
  activeUser={activeUser} // Add the activeUser prop here
  rpc={rpc}
  apiUrl={apiUrl}
/>
)}
{skipLevelModalOpen && (
  <SkipLevelModal
    chicken={chicken}
    levels={levelQueue} 
    selectedSkipLevels={skipLevels}
    onSkipLevel={handleSkipLevel} 
    onCancel={handleSkipLevelModalClose}
    onSelectSkipLevels={setSkipLevels}
  />
)}
    </div>
  );
};

export default ChickenModal;

