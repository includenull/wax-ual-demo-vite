import { Api, RpcError } from 'eosjs';
import { ExplorerApi } from 'atomicassets';

const GetNFTData = async (apiUrl, rpc, activeUser) => {
  console.log("apiUrl:", apiUrl);
  const api = new Api({ rpc, signatureProvider: null });
  const explorerApi = new ExplorerApi(apiUrl, 'atomicassets', { fetch: fetch.bind(window) });

  try {
    const assets = await explorerApi.getAssets({
      owner: 'dcycmissions',
      schema_name: 'chickens1222',
      limit: 1000,
    });

    // Fetch weapon assets
    const weaponAssets = await explorerApi.getAssets({
      owner: 'dcycmissions',
      schema_name: 'weapons', // Update this with the correct schema name for weapons
      limit: 1000,
    });

    console.log('Fetched assets:', assets);
    console.log('Fetched weapon assets:', weaponAssets);

    const [userMissions, missions, config, rngRolls] = await Promise.all([
      rpc.get_table_rows({
        json: true,
        code: "dcycmissions",
        scope: activeUser.accountName,
        table: "usermissions",
        limit: 1000,
      }),
      rpc.get_table_rows({
        json: true,
        code: "dcycmissions",
        scope: "dcycmissions",
        table: "missions",
      }),
      rpc.get_table_rows({
        json: true,
        code: "dcycmissions",
        scope: "dcycmissions",
        table: "config",
      }),
      rpc.get_table_rows({
        json: true,
        code: "dcycmissions",
        scope: "dcycmissions",
        table: "rngrolls",
      }),
    ]);

    console.log('userMissions:', userMissions);

    const nftData = userMissions.rows.map((userMission) => {
      console.log('Processing userMission:', userMission);

      const assetData = assets.find(asset => asset.asset_id === userMission.asset_ids[0]);

      // Find the weapon data using the weapon asset id
      const weaponAssetId = userMission.asset_ids[1]; // Get the second asset_id from the asset_ids array
      const weaponAssetData = weaponAssets.find(asset => asset.asset_id === weaponAssetId);

      // Log the weapon data
      console.log('Matching weaponAssetData:', weaponAssetData);

      const completedMissionsCount = userMission.completed_missions.length;

      if (!assetData) {
        console.log('Missing assetData for userMission.asset_ids[0]:', userMission.asset_ids[0]);
      }

      console.log('userMission.asset_ids[0]:', userMission.asset_ids[0]);
      console.log('Matching assetData:', assetData);

      const missionConfig = config.rows.find((cfg) => cfg.params.required_mission_length);

      const isClaimable = rngRolls.rows.some((roll) => roll.index === userMission.user_mission_id);

      // Extract image, template_id, and level from assetData
      const image = assetData.data.img;
      const template_id = assetData.template.template_id;
      const level = assetData.data.level;
      const weapon_template_id = weaponAssetData ? weaponAssetData.template.template_id : null;  // Extract weapon_template_id

      return {
        ...userMission,
        user_mission_id: userMission.index,
        assetData,
        missionConfig,
        isClaimable,
        image,
        template_id,
        level,
        weapon_template_id,  // Include weapon_template_id
        completedMissionsCount,
        weaponData: weaponAssetData,
      };
    });

    console.log('Generated NFT data:', nftData);

    return nftData;
  } catch (error) {
    if (error instanceof RpcError) {
      console.error(JSON.stringify(error.json, null, 2));
    } else {
      console.error('Error fetching NFT data:', error);
    }
    throw error;
  }
};

export const GetNFTStatus = (nft, missions) => {
  if (!nft) return "unknown";

  const { available_at } = nft;
  const isBusy = available_at !== "1970-01-01T00:00:00.000";

  if (isBusy) {
    return "busy";
  } else {
    const completedMission = missions.find(mission => mission.user_mission_id === nft.user_mission_id && mission.status === "complete");
    if (completedMission) {
      return "claimable";
    } else {
      return "available";
    }
  }
};

export default GetNFTData;