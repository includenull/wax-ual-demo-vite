const GetMissionsData = async (rpc, activeUser, nftTemplateIds, nftLevels, weaponTemplateIds) => {
  try {
    let missions = [];
    let more = true;
    let nextKey = null;

    console.log(`Input Data - NFT Template IDs: ${JSON.stringify(nftTemplateIds)}`);
    console.log(`Input Data - NFT Levels: ${JSON.stringify(nftLevels)}`);
    console.log(`Input Data - Weapon Template IDs: ${JSON.stringify(weaponTemplateIds)}`);

    while (more) {
      const missionsResult = await rpc.get_table_rows({
        json: true,
        code: 'dcycmissions',
        scope: 'dcycmissions',
        table: 'missions',
        lower_bound: nextKey,
        limit: 100,
      });

      const filteredMissions = missionsResult.rows.filter((mission) => {
        let isMatch = false;

        for (const allowlistItem of mission.allowlist) {
          const hasMatch = allowlistItem.every((item, index) => {
            const matchesNFT = nftTemplateIds[index] && nftTemplateIds[index] === Number(item.template_id) &&
              nftLevels[index] && Number(item.level_req) <= nftLevels[index];

            const matchesWeapon = weaponTemplateIds && weaponTemplateIds[index]
              ? weaponTemplateIds[index] === Number(item.template_id)
              : true;

            if (!matchesNFT) {
              console.log(`NFT not matched. NFT Template IDs: ${nftTemplateIds[index]}, Item Template ID: ${item.template_id}`);
              console.log(`NFT Levels: ${nftLevels[index]}, Item Level Requirement: ${item.level_req}`);
            }

            if (!matchesWeapon) {
              console.log(`Weapon not matched. Weapon Template IDs: ${weaponTemplateIds[index]}, Item Template ID: ${item.template_id}`);
            }

            return matchesNFT && matchesWeapon;
          });

          if (hasMatch) {
            isMatch = true;
            break;
          }
        }

        if (!isMatch) {
          console.log(`Mission not matched. Allowlist:`, mission.allowlist);
        }

        return isMatch;
      });

      missions = [...missions, ...filteredMissions];
      console.log(`Fetched ${missions.length} missions`);
      console.log('Missions Result:', missionsResult);

      if (missionsResult.more && missionsResult.next_key !== null) {
        nextKey = missionsResult.next_key;
      } else {
        more = false;
      }      
    }

    let userMissions = [];
    more = true;
    nextKey = null;

    while (more) {
      const userMissionsResult = await rpc.get_table_rows({
        json: true,
        code: 'dcycmissions',
        scope: activeUser.accountName,
        table: 'usermissions',
        lower_bound: nextKey,
      });

      userMissions = [...userMissions, ...userMissionsResult.rows];
      console.log(`Fetched ${userMissions.length} user missions`);
      console.log('User Missions Result:', userMissionsResult);
      more = userMissionsResult.more && userMissionsResult.rows.length > 0; // Break loop when no rows are returned
      nextKey = userMissionsResult.next_key;
    }

    const missionData = missions.map((mission) => {
      const userMission = userMissions.find((um) => um.mission_id === mission.mission_id);

      return {
        ...mission,
        userMission,
      };
    });

    console.log(`Matched ${missionData.length} missions with NFTs`);
    console.log('Mission Data:', missionData);

    return missionData;
  } catch (error) {
    console.error('Error fetching mission data:', error);
    throw error;
  }
};

export default GetMissionsData;
