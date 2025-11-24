import { useState } from 'react';
import './GameSelection.css';
import logo from '/logo.png';

function GameSelection({ onGameSelect }) {
  const [showMemoryOptions, setShowMemoryOptions] = useState(false);
  const [showMemoryDifficulty, setShowMemoryDifficulty] = useState(false);
  const [selectedMemoryType, setSelectedMemoryType] = useState(null);

  const handleMemoryClick = () => {
    setShowMemoryOptions(true);
  };

  const handleMemoryTypeSelect = (type) => {
    setSelectedMemoryType(type);
    setShowMemoryOptions(false);
    setShowMemoryDifficulty(true);
  };

  const handleDifficultySelect = (difficulty) => {
    onGameSelect(selectedMemoryType, difficulty);
  };

  return (
    <div className="game-selection">
      <img src={logo} width="100px" alt="Logo" />
      <h1 className="game-selection-title">NextElite Game Collection</h1>
      <p className="game-selection-subtitle">Choose a game to play</p>
      
      {!showMemoryOptions && !showMemoryDifficulty ? (
        <div className="game-grid">
          <div className="game-card" onClick={() => onGameSelect('big2')}>
            <div className="game-icon">🃏</div>
            <h2>Big 2</h2>
            <p>Classic card game</p>
          </div>
          
          <div className="game-card" onClick={() => onGameSelect('blackjack')}>
            <div className="game-icon">🎰</div>
            <h2>Black Jack</h2>
            <p>Beat the dealer!</p>
          </div>
          
          <div className="game-card" onClick={handleMemoryClick}>
            <div className="game-icon">🧠</div>
            <h2>Memory Grid</h2>
            <p>Test your memory</p>
          </div>
        </div>
      ) : showMemoryOptions ? (
        <div className="memory-options-selection">
          <h2>Choose Memory Game Type</h2>
          <div className="memory-options-grid">
            <div className="game-card" onClick={() => handleMemoryTypeSelect('memory')}>
              <div className="game-icon">🃏</div>
              <h2>Memory Grid (Cards)</h2>
              <p>Match poker cards</p>
            </div>
            <div className="game-card" onClick={() => handleMemoryTypeSelect('memory-icons')}>
              <div className="game-icon">🎯</div>
              <h2>Memory Grid (Icons)</h2>
              <p>Match emoji icons - Landscape mode</p>
            </div>
          </div>
          <button 
            className="back-btn" 
            onClick={() => setShowMemoryOptions(false)}
          >
            Back
          </button>
        </div>
      ) : (
        <div className="difficulty-selection">
          <h2>Select Difficulty</h2>
          <div className="difficulty-grid">
            <button 
              className="difficulty-btn easy" 
              onClick={() => handleDifficultySelect('easy')}
            >
              Easy
            </button>
            <button 
              className="difficulty-btn medium" 
              onClick={() => handleDifficultySelect('medium')}
            >
              Medium
            </button>
            <button 
              className="difficulty-btn expert" 
              onClick={() => handleDifficultySelect('expert')}
            >
              Expert
            </button>
          </div>
          <button 
            className="back-btn" 
            onClick={() => {
              setShowMemoryDifficulty(false);
              setSelectedMemoryType(null);
            }}
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
}

export default GameSelection;

