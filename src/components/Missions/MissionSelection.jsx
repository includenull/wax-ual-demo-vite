import React from 'react';

const MissionSelection = ({ selectedDirection, onDirectionChange }) => {
  const directions = ['north', 'south', 'east', 'west'];
  
  const selectedStyle = {
    backgroundColor: "#007bff",
    color: "white",
    border: "3px solid rgb(201, 34, 34)"
  };

  return (
    <div>
      <h2>Select a direction</h2>
      {directions.map((direction) => (
        <button
          key={direction}
          className="mission-button"
          onClick={() => onDirectionChange(direction)}
          style={selectedDirection === direction ? selectedStyle : {}}
        >
          {direction}
        </button>
      ))}
    </div>
  );
};

export default MissionSelection;
