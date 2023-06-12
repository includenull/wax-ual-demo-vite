import React, { useState, useEffect } from "react";
import "./Shop.css";
import { ExplorerApi } from "atomicassets";
import ClaimModal from "./ClaimModal";
import { checkActions } from "../../checkActions";

const handleUnpack = async (rpc, ual, listings, listingId, amount) => {
  console.log("Unpacking listing:", listingId, "amount:", amount);
  const selectedListing = listings.find((listing) => listing.listing_id === listingId);
  const selectedTemplateId = selectedListing.template_id;


  try {
    const account = ual.activeUser ? ual.activeUser.accountName : null;
    if (!account) {
      console.error("No active user account found.");
      return;
    }

    // Fetch assets owned by the user
    const assetsResult = await rpc.get_table_rows({
      code: "atomicassets",
      scope: account,
      table: "assets",
      limit: 1000,
    });

    const userAssets = assetsResult.rows;

    // Find an asset owned by the user that matches the selected listing ID
    const selectedAsset = userAssets.find((asset) => asset.template_id === selectedTemplateId);

    if (!selectedAsset) {
      console.error("No matching asset found for the selected listing ID.");
      alert("You don't have any items from the selected listing ID in your wallet.");
      return;
    }

    // Unpacking logic
    const actions = [
      {
        account: "atomicassets",
        name: "transfer",
        authorization: [
          {
            actor: account,
            permission: "active",
          },
        ],
        data: {
          from: account,
          to: "dcycstealing",
          asset_ids: [selectedAsset.asset_id],
          memo: `blend:${listingId}`,
        },
      },
    ];

    const result = await ual.activeUser.signTransaction(
      {
        actions: actions,
      },
      {
        broadcast: true,
      }
    );

    console.log("Unpacking result:", result);
    alert(`Successfully unpacked ${amount} item(s) from listing: ${listingId}`);
  } catch (error) {
    console.error("Error unpacking listing:", error);
    alert("Failed to unpack item(s). Please try again.");
  }
};


const Shop = ({ rpc, ual, ipfsUrl, apiUrl }) => {
  const explorerApi = new ExplorerApi(apiUrl, 'atomicassets', { fetch: fetch.bind(window) });
  const [listings, setListings] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [skippedSteal, setSkippedSteal] = useState(null);

  const fetchTemplateImage = async (collection_name, template_id) => {
    try {
      const template = await explorerApi.getTemplate(collection_name, template_id);
      const imgData = template.immutable_data.img;
      console.log("Fetched image data:", imgData);
      if (!imgData) {
        return null;
      }

      const imageUrl = `${ipfsUrl}/${imgData}`;
      return imageUrl;
    } catch (error) {
      console.error("Error fetching template image:", error);
      return null;
    }
  };

  const fetchUserBalance = async (account, tokenContract) => {
    try {
      const balanceResult = await rpc.get_currency_balance(tokenContract, account);
      const balance = parseFloat(balanceResult[0]);
      return balance;
    } catch (error) {
      console.error("Error fetching user balance:", error);
      return null;
    }
  };

  const fetchShopListings = async () => {
    const result = await rpc.get_table_rows({
      json: true,
      code: "dcycmissions",
      scope: "dcycmissions",
      table: "shoplistings",
      limit: -1,
    });
  
    const currentTime = new Date();
    const availableListings = result.rows.filter(
      (listing) =>
        new Date(listing.start_time) <= currentTime &&
        new Date(listing.end_time) > currentTime
    );
  
    const listingsWithImages = (
      await Promise.all(
        availableListings
          .filter((listing) => listing.template_id) // Filter out listings without a template_id
          .map(async (listing) => {
            try {
              const collection_name = "test123wagmi"; // Updated collection name
              const template_id = listing.template_id;
  
              const imageUrl = await fetchTemplateImage(collection_name, template_id);
  
              if (!imageUrl) {
                return null;
              }
  
              return { ...listing, imgUrl: imageUrl };
            } catch (error) {
              console.error(`Error fetching template with id ${listing.template_id}:`, error);
              return null;
            }
          })
      )
    ).filter((listing) => listing); // Filter out null values
    console.log("Listings with images:", listingsWithImages);
  
    setListings(listingsWithImages);
  };
  
  
  

  useEffect(() => {
    fetchShopListings();
  }, [rpc]);

  const handleQuantityChange = (listingId, newQuantity) => {
    setQuantities((prevQuantities) => ({
      ...prevQuantities,
      [listingId]: newQuantity,
    }));
  };
  
  const handleBuy = async (listingId, amount) => {
    try {
      const account = ual.activeUser ? ual.activeUser.accountName : null;
      if (!account) {
        console.error("No active user account found.");
        return;
      }
    
      const listing = listings.find((l) => l.listing_id === listingId);
      const totalPrice = parseFloat(listing.cost[0].quantity) * amount;
      const tokenContract = listing.cost[0].contract;
    
      // Check if user has sufficient balance
      const userBalance = await fetchUserBalance(account, tokenContract);
      if (userBalance < totalPrice) {
        alert("Insufficient balance to complete the purchase.");
        return;
      }
    
      const actions = [
        {
          account: "dcycmissions", // Contract account name
          name: "buylisting", // Contract action name
          authorization: [
            {
              actor: account,
              permission: "active",
            },
          ],
          data: {
            owner: account,
            listing_id: listingId,
            amount: amount,
          },
        },
      ];
    
      const result = await ual.activeUser.signTransaction(
        {
          actions: actions,
        },
        {
          broadcast: true,
        }
      );
    } catch (error) {
      console.error("Error buying listing:", error);
      alert("Failed to buy item(s). Please try again.");
    }
  };
  
  const [modalOpen, setModalOpen] = useState(false);
  const [currentListing, setCurrentListing] = useState(null);

  const handleClaimModalOpen = (listing) => {
    setCurrentListing(listing);
    setModalOpen(true);
  };

  const handleClaimModalClose = () => {
    setCurrentListing(null);
    setModalOpen(false);
  };

  const handleClaim = async () => {
    try {
      const account = ual.activeUser ? ual.activeUser.accountName : null;
      if (!account) {
        console.error("No active user account found.");
        return;
      }
  
      checkActions(account).then((skippedSteal) => console.log("Skipped steal:", skippedSteal));
  
  
      // Fetch rolls owned by the user
      const rollsResult = await rpc.get_table_rows({
        code: "dcycstealing",
        scope: "dcycstealing",
        table: "rolls",
      });
  
      // Filter rolls that belong to the current user
      const userRolls = rollsResult.rows.filter(roll => roll.owner === account);
  
      if (userRolls.length === 0) {
        console.error("No rolls found for the user.");
        alert("You don't have any rolls to claim.");
        return;
      }
  
      // Claim logic for the first roll
      const firstRoll = userRolls[0];
      const actions = [
        {
          account: "dcycstealing",
          name: "claim",
          authorization: [
            {
              actor: account,
              permission: "active",
            },
          ],
          data: {
            owner: account,
            roll: firstRoll.index,
          },
        },
      ];
  
      const result = await ual.activeUser.signTransaction(
        {
          actions: actions,
        },
        {
          broadcast: true,
        }
      );
  
      console.log("Claim result:", result);
      const userAccount = await ual.activeUser.getAccountName();
      const contractAccount = "dcycstealing";
      const actionName = "logunpack";
      const skippedSteal = await checkActions(userAccount, contractAccount, actionName);
  
      if (skippedSteal !== null) {
        console.log(`Transaction by user ${userAccount}: skipped_steal = ${skippedSteal}`);
        setSkippedSteal(skippedSteal); // <-- Add this line
      } else {
        console.log('No matching actions found');
      }
      alert(`Successfully claimed 1 roll.`);
    } catch (error) { 
    console.error("Error claiming rolls:", error);
    alert("Failed to claim roll. Please try again.");
  }
};

  return (
    <div>
      <h2>Shop</h2>
      {listings.map((listing) => (
        <div key={listing.listing_id} className="listing">
          <img src={listing.imgUrl} alt={listing.collection_name} />
          <div>{listing.collection_name}</div>
          <div>Price: {((parseFloat(listing.cost[0].quantity) * (quantities[listing.listing_id] || 1)).toFixed(4))} {listing.cost[0].contract}</div>
          <div>
            <button
              onClick={() =>
                handleQuantityChange(
                  listing.listing_id,
                  Math.max((quantities[listing.listing_id] || 1) - 1, 1)
                )
              }
            >
              -
            </button>
            <input
              type="number"
              min="1"
              value={quantities[listing.listing_id] || 1}
              onChange={(e) =>
                handleQuantityChange(listing.listing_id, parseInt(e.target.value))
              }
            />
            <button
              onClick={() =>
                handleQuantityChange(
                  listing.listing_id,
                  (quantities[listing.listing_id] || 1) + 1
                )
              }
            >
              +
            </button>
            <button
              onClick={() =>
                handleBuy(listing.listing_id, quantities[listing.listing_id] || 1)
              }
            >
              Buy
            </button>
            <button
              onClick={() =>
                handleUnpack(
                  rpc,
                  ual,
                  listings,
                  listing.listing_id,
                  quantities[listing.listing_id] || 1
                )
              }
            >
              Unpack
            </button>
            <button
  onClick={() =>
    handleClaimModalOpen(listing)
  }
>
  Claim
</button>
          </div>
        </div>
      ))}
<ClaimModal isOpen={modalOpen} handleClose={handleClaimModalClose} handleClaim={handleClaim} skippedSteal={skippedSteal} />
    </div>  
  );
};  

  export default Shop;