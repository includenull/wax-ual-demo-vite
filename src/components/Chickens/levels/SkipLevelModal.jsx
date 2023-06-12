import React, { useEffect } from 'react';

const SkipLevelModal = ({ chicken = {}, levels = [], onSkipLevel, onCancel }) => {
  console.log('onSkipLevel:', onSkipLevel);

  const levelQueue = chicken.mutable_data?.level_queue || [];

  useEffect(() => {
    console.log(`Chicken with asset_id ${chicken.asset_id} can skip levels ${levelQueue.join(", ")}.`);
  }, [chicken, levelQueue]);

  const handleSkipLevel = () => {
    console.log('handleSkipLevel called');
    console.log('chicken:', chicken);
    console.log('onSkipLevel is a function:', typeof onSkipLevel === 'function');
    console.log('levelQueue:', levelQueue);
    if(chicken && chicken.asset_id && typeof onSkipLevel === 'function'){
      console.log('onSkipLevel will be called');
      onSkipLevel(chicken.asset_id, levelQueue);
    } else {
      console.log('onSkipLevel was not called');
    }
  };

  return (
    <div className="skip-level-modal">
      <h3>Skip Level Modal</h3>
      <div>
        <span>Current Level: {chicken.mutable_data?.level || 0}</span>
      </div>
      <button onClick={handleSkipLevel}>Skip Level</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  );
};

export default SkipLevelModal;
