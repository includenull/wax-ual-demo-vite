// src/components/Exchange/Exchange.js

import React from 'react';
import Swap from '../Swap/Swap';

const Exchange = ({ ual, rpc }) => {
  return (
    <div>
      <h1>Exchange</h1>
      <Swap rpc={rpc} ual={ual} />
    </div>
  );
};

export default Exchange;