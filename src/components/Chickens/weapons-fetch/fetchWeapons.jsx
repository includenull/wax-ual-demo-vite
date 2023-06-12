// chickens/weapons-fetch/fetchWeapons.jsx

import { useEffect, useState } from 'react';
import { ExplorerApi } from 'atomicassets';

export const useWeapons = (rpc, apiUrl, shouldFetch, activeUser) => {
  const [weapons, setWeapons] = useState([]);
  const explorerApi = new ExplorerApi(apiUrl, 'atomicassets', { fetch: fetch.bind(window) });

  useEffect(() => {
    const fetchWeapons = async () => {
      const fetchedWeapons = await getWeapons(rpc, apiUrl, activeUser);
      setWeapons(fetchedWeapons);
    };
    
    const getWeapons = async (rpc, apiUrl, user) => {
        console.log('User:', user);
        try {
          const weaponsResult = await rpc.get_table_rows({
            code: 'dcycmissions',
            scope: activeUser.accountName,
            table: 'staked',
            limit: 100,
          });
      
          const weaponAssetIds = weaponsResult.rows.map(row => row.asset_id);
          const weaponPromises = weaponAssetIds.map(async (asset_id) => {
            const weapon = await explorerApi.getAsset(asset_id);
            return weapon;
          });
      
          const fetchedWeapons = (await Promise.all(weaponPromises)).filter(
            weapon => weapon.schema.schema_name === "weapons"
          );
          return fetchedWeapons;
        } catch (error) {
          console.error('Error fetching weapons:', error);
          return [];
        }
      };
      
      

      if (shouldFetch) {
        fetchWeapons();
      }
    }, [rpc, apiUrl, shouldFetch, activeUser]);


  return weapons;
};
