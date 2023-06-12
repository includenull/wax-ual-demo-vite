import React, { useState, useEffect } from 'react';
import { UALContext } from 'ual-reactjs-renderer';
import NFTList from './NFTList';
import { RpcError } from 'eosjs';
import NFTActions from './NFTActions';
import MissionSelection from './MissionSelection.jsx';
import GetNFTData from "./Helpers/GetNFTData";
import GetMissionsData from './Helpers/GetMissionsData';
import './Missions.css';


const Missions = ({ rpc, apiUrl, ipfsUrl, ual }) => {
  const [nfts, setNFTs] = useState([]);
  const [missions, setMissions] = useState([]);
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [selectedDirection, setSelectedDirection] = useState(null);
  const { activeUser } = React.useContext(UALContext);
  const [weaponTemplateId, setWeaponTemplateId] = useState(null);
  const [hasWeapon, setHasWeapon] = useState(false);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let nftData = await GetNFTData(apiUrl, rpc, activeUser);
    
        nftData = nftData.map(nft => ({
          ...nft,
          hasWeapon: !!nft?.weaponData,
        }));
    
        const nftTemplateId = nftData[0]?.assetData?.template?.template_id;
        const nftLevel = nftData[0]?.assetData?.data?.level;
    
        let page = 0;
        const pageSize = 100; // Or however many you want per page
        let missionsData = [];
        let tempMissionsData;
        do {
          tempMissionsData = await GetMissionsData(rpc, activeUser, nftTemplateId, nftLevel, weaponTemplateId, page, pageSize);
          missionsData = [...missionsData, ...tempMissionsData];
          console.log(`Fetched page ${page} of missions data:`, tempMissionsData);
          page++;
        } while (tempMissionsData.length === pageSize);
    
        console.log("NFT Data:", nftData);
        console.log("All Missions Data:", missionsData);
        console.log("NFT Template ID:", nftTemplateId);
        console.log("NFT Level:", nftLevel);
    
        setNFTs(nftData);
        setMissions(missionsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    
    if (activeUser) {
      fetchData();
    } 
  }, [activeUser, rpc, weaponTemplateId]);
  
  
  

  const handleDirectionChange = (direction) => {
    setSelectedDirection(direction);
  };

  const handleSendMission = async (event) => {
    try {
      if (!selectedNFTs.length || (!selectedDirection && !selectedNFTs.some(nft => nft.hasWeapon))) {
        alert('Please select an NFT and a direction');
        return;
      }
  
      const actions = selectedNFTs.map((nft) => {
        const nftTemplateId = nft.assetData.template.template_id;
        const nftLevel = nft.assetData.data.level;
        const nftIndex = nft.index;
  
        let filteredMissions;
  
        // Check if the NFT has a weapon
        const nftHasWeapon = nfts.find(n => n.index === nftIndex).hasWeapon;
  
        // Use nftHasWeapon to check if the current NFT has a weapon
        if (nftHasWeapon) {
          // Automatically send the NFT on the weapon mission
          filteredMissions = missions.filter((mission) => mission.mission_type === 'weapon');
        } else {
          filteredMissions = missions.filter((mission) => mission.mission_type === selectedDirection);
        }
  
        if (!filteredMissions || filteredMissions.length === 0) {
          alert('No matching mission found');
          return;
        }
  
        const matchingMission = filteredMissions[0];
  
        const { accountName } = activeUser;
        let { requestPermission } = activeUser;
        if (!requestPermission && activeUser.scatter) {
          requestPermission = activeUser.scatter.identity.accounts[0].authority;
        }
  
        return {
          account: 'dcycmissions',
          name: 'missiongo',
          authorization: [
            {
              actor: accountName,
              permission: requestPermission,
            },
          ],
          data: {
            owner: accountName,
            user_mission_id: nftIndex,
            mission_id: matchingMission.mission_id,
          },
        };
      });
  
      console.log('Actions to be sent:', actions);
  
      const transaction = await activeUser.signTransaction(
        { actions },
        {
          blocksBehind: 3,
          expireSeconds: 120,
          broadcast: true,
        }
      );
  
      console.log(transaction);
      alert('Transaction ID: ' + transaction?.transactionId);
    } catch (e) {
      alert(e.toString());
      console.error(e.message, e.stack);
      if (e instanceof RpcError) console.log(JSON.stringify(e.json, null, 2));
    }
  
    setSelectedDirection(null);
  };
  
  
  
  

  const handleCancelMission = async (selectedNFTs) => {
    try {
      console.log('Cancelling mission for NFTs:', selectedNFTs); // New log
  
      const { accountName } = activeUser;
      let { requestPermission } = activeUser;
      if (!requestPermission && activeUser.scatter) {
        // Workaround for scatter
        requestPermission = activeUser.scatter.identity.accounts[0].authority;
      }
  
      // Prepare the actions for the transaction
      const actions = selectedNFTs.map((nft) => {
        console.log('Preparing action for NFT:', nft); // New log
        return {
          account: "dcycmissions",
          name: "missioncncl",
          authorization: [
            {
              actor: accountName,
              permission: requestPermission,
            },
          ],
          data: {
            owner: accountName,
            user_mission_id: nft.user_mission_id,
          },
        };
      });
  
      console.log('Actions to be sent:', actions); // New log
  
      // Send the transaction
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
  
  

  const handleAbortMission = async (selectedNFTs) => {
    if (!selectedNFTs.length) {
      alert('Please select an NFT first.');
      return;
    }
  
    try {
      const { accountName } = activeUser;
  
      // Prepare the actions for the transaction
      const actions = selectedNFTs.map((nft) => {
        return {
          account: 'dcycmissions',
          name: 'missionabrt',
          authorization: [
            {
              actor: accountName,
              permission: activeUser.requestPermission || 'active',
            },
          ],
          data: {
            owner: accountName,
            user_mission_id: nft.index,
          },
        };
      });
  
      // Send the transaction
      const transaction = await activeUser.signTransaction(
        { actions },
        {
          blocksBehind: 3,
          expireSeconds: 120,
          broadcast: true,
        }
      );
  
      console.log('Transaction:', transaction);
      alert('Missions aborted successfully!');
    } catch (error) {
      console.error('Error aborting mission:', error);
      alert('Error aborting mission. Please try again.');
    }
  };
  
  

  const handleCompleteMission = async () => {
    if (!selectedNFTs.length) {
      alert('Please select an NFT first.');
      return;
    }
  
    // Limit the number of completed missions to 40
    const completedMissions = selectedNFTs.slice(0, 40);
  
    try {
      const { accountName } = activeUser;
  
      // Prepare the actions for the transaction
      const actions = completedMissions.map((nft) => {
        return {
          account: 'dcycmissions',
          name: 'missioncomp',
          authorization: [
            {
              actor: accountName,
              permission: activeUser.requestPermission || 'active',
            },
          ],
          data: {
            owner: accountName,
            user_mission_id: nft.index,
          },
        };
      });
  
      // Send the transaction
      const transaction = await activeUser.signTransaction(
        { actions },
        {
          blocksBehind: 3,
          expireSeconds: 120,
          broadcast: true,
        }
      );
  
      alert('Missions completed successfully!');
    } catch (error) {
      console.error('Error completing mission:', error);
      alert('Error completing mission. Please try again.');
    }
  };
  
  
  
  

  const handleClaimMission = async (selectedNFTs) => {
    if (!selectedNFTs.length) {
      alert('Please select an NFT first.');
      return;
    }
  
    try {
      const { accountName } = activeUser;
  
      // Prepare the actions for the transaction
      const actions = selectedNFTs.map((nft) => {
        return {
          account: 'dcycmissions',
          name: 'missioncoll',
          authorization: [
            {
              actor: accountName,
              permission: activeUser.requestPermission || 'active',
            },
          ],
          data: {
            owner: accountName,
            user_mission_roll: nft.index,
          },
        };
      });
  
      // Send the transaction
      const transaction = await activeUser.signTransaction(
        { actions },
        {
          blocksBehind: 3,
          expireSeconds: 120,
          broadcast: true,
        }
      );
  
      console.log('Transaction:', transaction);
      alert('Missions claimed successfully!');
    } catch (error) {
      console.error('Error claiming mission:', error);
      alert('Error claiming mission. Please try again.');
    }
  };
  
  
  

  return (
    <div>
      {loading ? (
        <img src="/Images/Loading_icon.gif" alt="Loading..." />
      ) : (
        <>
          <h1>Missions</h1>
          <MissionSelection
            selectedDirection={selectedDirection}
            onDirectionChange={handleDirectionChange}
          />
          <NFTList
            nfts={nfts}
            selectedNFTs={selectedNFTs}
            setSelectedNFTs={setSelectedNFTs}
            missions={missions}
            ipfsUrl={ipfsUrl} // Add this prop
          />
          <NFTActions
            selectedNFTs={selectedNFTs}
            missions={missions}
            selectedDirection={selectedDirection}
            onSendMission={handleSendMission}
            onCancelMission={handleCancelMission}
            onAbortMission={handleAbortMission}
            onCompleteMission={handleCompleteMission}
            onClaimMission={handleClaimMission}
          />
        </>
      )}
    </div>
  );  
};

export default Missions;
