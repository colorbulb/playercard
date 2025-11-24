import { useState } from 'react';
import './GameSelection.css';

function GameSelection({ onGameSelect }) {
  const [showMemoryDifficulty, setShowMemoryDifficulty] = useState(false);

  const handleMemoryClick = () => {
    setShowMemoryDifficulty(true);
  };

  const handleDifficultySelect = (difficulty) => {
    onGameSelect('memory', difficulty);
  };

  return (
    <div className="game-selection">
      <h1 className="game-selection-title">NextElite Game Collection</h1>
      <p className="game-selection-subtitle">Choose a game to play</p>
      
      {!showMemoryDifficulty ? (
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
            onClick={() => setShowMemoryDifficulty(false)}
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
}

export default GameSelection;

