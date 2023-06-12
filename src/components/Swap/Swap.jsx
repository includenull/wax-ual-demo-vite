import React, { useState, useEffect, useContext } from "react";

const Swap = ({ rpc, ual }) => {
  const [swapPool, setSwapPool] = useState(null);
  const [tokenA, setTokenA] = useState({ quantity: 0 });
  const [tokenB, setTokenB] = useState({ quantity: 0 });
  const [slippage, setSlippage] = useState(0.5);
  const [inputAssetA, setInputAssetA] = useState(true);
  const [showMessageBox, setShowMessageBox] = useState("");

  const staticExchangeRate = () => {
    if (!swapPool) {
      return 0;
    }
  
    const assetA = parseFloat(swapPool.asset_a.quantity);
    const assetB = parseFloat(swapPool.asset_b.quantity);
  
    return (100 * assetA) / assetB;
  };  

  const fetchSwapPool = async () => {
    const result = await rpc.get_table_rows({
      json: true,
      code: "dcycmissions",
      scope: "dcycmissions",
      table: "swaps",
      limit: 1,
    });

    console.log("Swap pool result:", result);

    if (result.rows.length > 0) {
      setSwapPool(result.rows[0]);
    }
  };

  useEffect(() => {
    fetchSwapPool();
  }, [rpc]);

  const handleTokenAChange = (e) => {
    const quantity = parseFloat(e.target.value).toFixed(8);
    setTokenA({ ...tokenA, quantity: parseFloat(quantity) });
  };

  const handleSlippageChange = (e) => {
    setSlippage(parseFloat(e.target.value));
  };

  const switchTokens = () => {
    setInputAssetA(!inputAssetA);
  };

  const calculateExchangeRate = () => {
    if (!swapPool) {
      return 0;
    }

    const assetA = parseFloat(swapPool.asset_a.quantity);
    const assetB = parseFloat(swapPool.asset_b.quantity);

    return inputAssetA ? assetB / assetA : assetA / assetB;
  };
  

  const executeSwap = async () => {
    if (!ual.activeUser) {
      console.log('User is not authenticated');
      return;
    }

    if (!swapPool) {
      console.error("Swap pool not loaded");
      return;
    }

    const assetASymbol = swapPool.asset_a.quantity.split(" ")[1];
    const assetAContract = swapPool.asset_a.contract;
    const assetBSymbol = swapPool.asset_b.quantity.split(" ")[1];
    const assetBContract = swapPool.asset_b.contract;

    const input = {
      quantity: `${tokenA.quantity.toFixed(8)} ${inputAssetA ? assetASymbol : assetBSymbol}`,
      contract: inputAssetA ? assetAContract : assetBContract,
    };
    const expected = {
      quantity: `${tokenB.quantity.toFixed(8)} ${inputAssetA ? assetBSymbol : assetASymbol}`,
      contract: inputAssetA ? assetBContract : assetAContract,
    };

    const actions = [
      {
        account: "dcycmissions",
        name: "swap",
        authorization: [
          {
            actor: ual.activeUser.accountName,
            permission: 'active',
          },
        ],
        data: {
          owner: ual.activeUser.accountName,
          swap_pool: swapPool.swap_pool,
          in_asset_a: inputAssetA,
          input,
          expected,
        },
      },
    ];

    console.log("Action:", actions[0]);

    try {
      const result = await ual.activeUser.signTransaction({ actions }, { blocksBehind: 3, expireSeconds: 120 });
      console.log(result);
      setShowMessageBox(`Swap successful! You received ${tokenB.quantity.toFixed(8)} ${inputAssetA ? assetBSymbol : assetASymbol}.`);
    } catch (error) {
      console.error("Transaction error:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        if (error.message.includes("Detected price drift")) {
          setShowMessageBox("Detected price drift. Please increase slippage (at your own risk)");
        } else if (error.message.includes("Overdrawn balance")) {
          setShowMessageBox("Insufficient balance.");
        } else {
          setShowMessageBox("Transaction error occurred. Please try again later.");
        }
      }
    }
  }; 
    
    const updateTokenBAmount = () => {
    if (!tokenA.quantity) {
    setTokenB({ ...tokenB, quantity: 0 });
    return;
    }
    
    const exchangeRate = calculateExchangeRate();
    const expectedAmount = tokenA.quantity * exchangeRate * (1 - slippage / 100);
    const formattedExpectedAmount = expectedAmount.toFixed(8);
    setTokenB({ ...tokenB, quantity: parseFloat(formattedExpectedAmount) });
    };
    
    useEffect(() => {
    updateTokenBAmount();
    }, [tokenA.quantity, swapPool, slippage, inputAssetA]);
    
    return (
    <div>
    <h2>Swap</h2>
    <div>
    <label>Input Token:</label>
    <input
           type="number"
           value={tokenA.quantity}
           onChange={handleTokenAChange}
         />
    </div>
    <div>
    <label>Output Token:</label>
    <input
           type="number"
           value={tokenB.quantity}
           readOnly
         />
    </div>
    <div>
    <button onClick={switchTokens}>Switch</button>
    </div>
    <div>
    <label>Slippage:</label>
    <input
           type="range"
           min="0.1"
           max="10"
           step="0.05"
           value={slippage}
           onChange={handleSlippageChange}
         />
        <span>{slippage}%</span>
        </div>
        <div className="exchange-rate" style={{ display: 'flex', justifyContent: 'center' }}>
        <span>Exchange Rate: {swapPool ? `100 ${swapPool.asset_b.quantity.split(" ")[1]} = ${staticExchangeRate().toFixed(8)} ${swapPool.asset_a.quantity.split(" ")[1]}` : 'Loading...'}</span>
      </div>
      <button onClick={executeSwap}>Swap</button>
      {showMessageBox && (
        <div className="message-box">
          <p>{showMessageBox}</p>
        </div>
      )}
    </div>
  );
};

export default Swap;