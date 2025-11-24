import { useState, useEffect } from 'react';
import { saveScore, getHighScores } from '../../firebase/scores';
import './Big2.css';

function Big2({ onBack }) {
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [lastPlay, setLastPlay] = useState(null);
  const [gameStatus, setGameStatus] = useState('playing');
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [highScores, setHighScores] = useState([]);

  useEffect(() => {
    initializeGame();
    loadHighScores();
  }, []);

  const initializeGame = () => {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
    const newDeck = [];
    
    for (let suit of suits) {
      for (let rank of ranks) {
        newDeck.push({ suit, rank, id: `${suit}-${rank}` });
      }
    }
    
    // Shuffle deck
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    
    setDeck(newDeck);
    setPlayerHand(newDeck.slice(0, 13).sort((a, b) => getCardValue(a) - getCardValue(b)));
    setGameStatus('playing');
    setSelectedCards([]);
    setLastPlay(null);
  };

  const getCardValue = (card) => {
    const rankValues = {
      '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
      'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15
    };
    return rankValues[card.rank] || 0;
  };

  const toggleCardSelection = (card) => {
    if (selectedCards.find(c => c.id === card.id)) {
      setSelectedCards(selectedCards.filter(c => c.id !== card.id));
    } else {
      setSelectedCards([...selectedCards, card]);
    }
  };

  const playCards = () => {
    if (selectedCards.length === 0) return;
    
    // Simple validation - in a full game, you'd check if the play is valid
    const newHand = playerHand.filter(card => 
      !selectedCards.find(selected => selected.id === card.id)
    );
    
    setPlayerHand(newHand);
    setLastPlay([...selectedCards]);
    setSelectedCards([]);
    
    if (newHand.length === 0) {
      setGameStatus('won');
      setShowNameInput(true);
    }
  };

  const pass = () => {
    setSelectedCards([]);
  };

  const loadHighScores = async () => {
    const scores = await getHighScores('Big 2');
    setHighScores(scores);
  };

  const handleSaveScore = async () => {
    if (!playerName.trim()) return;
    const score = 1000 - (13 - playerHand.length) * 50; // Simple scoring
    await saveScore('Big 2', 'N/A', score, playerName);
    setShowNameInput(false);
    loadHighScores();
  };

  return (
    <div className="big2-game">
      <button className="back-button" onClick={onBack}>← Back to Menu</button>
      
      <div className="big2-container">
        <div className="big2-header">
          <h1>Big 2</h1>
          <button onClick={initializeGame} className="new-game-btn">New Game</button>
        </div>

        {gameStatus === 'won' && showNameInput && (
          <div className="score-modal">
            <h2>Congratulations! You won!</h2>
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="name-input"
            />
            <button onClick={handleSaveScore} className="save-score-btn">Save Score</button>
          </div>
        )}

        <div className="last-play">
          <h3>Last Play:</h3>
          {lastPlay ? (
            <div className="cards-display">
              {lastPlay.map(card => (
                <div key={card.id} className="card">
                  <span className={`rank ${card.suit === '♥' || card.suit === '♦' ? 'red' : ''}`}>
                    {card.rank}
                  </span>
                  <span className={`suit ${card.suit === '♥' || card.suit === '♦' ? 'red' : ''}`}>
                    {card.suit}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p>No plays yet</p>
          )}
        </div>

        <div className="player-hand">
          <h3>Your Hand ({playerHand.length} cards)</h3>
          <div className="cards-display">
            {playerHand.map(card => {
              const isSelected = selectedCards.find(c => c.id === card.id);
              return (
                <div
                  key={card.id}
                  className={`card ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleCardSelection(card)}
                >
                  <span className={`rank ${card.suit === '♥' || card.suit === '♦' ? 'red' : ''}`}>
                    {card.rank}
                  </span>
                  <span className={`suit ${card.suit === '♥' || card.suit === '♦' ? 'red' : ''}`}>
                    {card.suit}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="game-actions">
          <button onClick={playCards} disabled={selectedCards.length === 0} className="action-btn">
            Play Cards
          </button>
          <button onClick={pass} className="action-btn">Pass</button>
        </div>

        <div className="high-scores">
          <h3>High Scores</h3>
          <div className="scores-list">
            {highScores.length > 0 ? (
              highScores.map((score, index) => (
                <div key={score.id} className="score-item">
                  <span className="rank">#{index + 1}</span>
                  <span className="name">{score.playerName}</span>
                  <span className="score">{score.score}</span>
                </div>
              ))
            ) : (
              <p>No scores yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Big2;

