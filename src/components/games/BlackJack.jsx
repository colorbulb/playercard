import { useState, useEffect } from 'react';
import { saveScore, getHighScores } from '../../firebase/scores';
import './BlackJack.css';

function BlackJack({ onBack }) {
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [gameStatus, setGameStatus] = useState('betting'); // betting, playing, dealer, finished
  const [playerScore, setPlayerScore] = useState(0);
  const [dealerScore, setDealerScore] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [highScores, setHighScores] = useState([]);
  const [dealerHidden, setDealerHidden] = useState(true);

  useEffect(() => {
    initializeDeck();
    loadHighScores();
  }, []);

  const initializeDeck = () => {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const newDeck = [];
    
    for (let suit of suits) {
      for (let rank of ranks) {
        newDeck.push({ suit, rank, id: `${suit}-${rank}-${Math.random()}` });
      }
    }
    
    // Shuffle
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    
    setDeck(newDeck);
  };

  const getCardValue = (card) => {
    if (card.rank === 'A') return 11;
    if (['J', 'Q', 'K'].includes(card.rank)) return 10;
    return parseInt(card.rank);
  };

  const calculateHandValue = (hand) => {
    let value = 0;
    let aces = 0;
    
    for (let card of hand) {
      if (card.rank === 'A') {
        aces++;
        value += 11;
      } else {
        value += getCardValue(card);
      }
    }
    
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }
    
    return value;
  };

  const dealCard = () => {
    if (deck.length === 0) {
      initializeDeck();
      return deck[0];
    }
    const card = deck[0];
    setDeck(deck.slice(1));
    return card;
  };

  const startGame = () => {
    initializeDeck();
    const newDeck = [];
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    
    for (let suit of suits) {
      for (let rank of ranks) {
        newDeck.push({ suit, rank, id: `${suit}-${rank}-${Math.random()}` });
      }
    }
    
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    
    setDeck(newDeck);
    const player = [newDeck[0], newDeck[2]];
    const dealer = [newDeck[1], newDeck[3]];
    
    setPlayerHand(player);
    setDealerHand(dealer);
    setDeck(newDeck.slice(4));
    setGameStatus('playing');
    setDealerHidden(true);
    setPlayerScore(calculateHandValue(player));
    setDealerScore(calculateHandValue([dealer[0]])); // Only show first card
  };

  const hit = () => {
    if (gameStatus !== 'playing') return;
    
    const newCard = dealCard();
    const newHand = [...playerHand, newCard];
    setPlayerHand(newHand);
    
    const score = calculateHandValue(newHand);
    setPlayerScore(score);
    
    if (score > 21) {
      setGameStatus('finished');
      setDealerHidden(false);
      setDealerScore(calculateHandValue(dealerHand));
    }
  };

  const stand = () => {
    if (gameStatus !== 'playing') return;
    
    setGameStatus('dealer');
    setDealerHidden(false);
    let currentDealerHand = [...dealerHand];
    let currentDealerScore = calculateHandValue(currentDealerHand);
    
    // Dealer draws until 17 or higher
    const dealerPlay = () => {
      if (currentDealerScore < 17 && deck.length > 0) {
        const newCard = dealCard();
        currentDealerHand = [...currentDealerHand, newCard];
        currentDealerScore = calculateHandValue(currentDealerHand);
        setDealerHand(currentDealerHand);
        setDealerScore(currentDealerScore);
        
        if (currentDealerScore < 17) {
          setTimeout(dealerPlay, 500);
        } else {
          finishGame();
        }
      } else {
        finishGame();
      }
    };
    
    setTimeout(dealerPlay, 500);
  };

  const finishGame = () => {
    setGameStatus('finished');
    const finalPlayerScore = calculateHandValue(playerHand);
    const finalDealerScore = calculateHandValue(dealerHand);
    
    setPlayerScore(finalPlayerScore);
    setDealerScore(finalDealerScore);
    
    if (finalPlayerScore <= 21 && (finalDealerScore > 21 || finalPlayerScore > finalDealerScore)) {
      setShowNameInput(true);
    }
  };

  const loadHighScores = async () => {
    const scores = await getHighScores('Black Jack');
    setHighScores(scores);
  };

  const handleSaveScore = async () => {
    if (!playerName.trim()) return;
    const score = playerScore <= 21 ? (21 - playerScore) * 10 : 0;
    await saveScore('Black Jack', 'N/A', score, playerName);
    setShowNameInput(false);
    loadHighScores();
  };

  const getGameResult = () => {
    if (gameStatus !== 'finished') return '';
    if (playerScore > 21) return 'You Busted!';
    if (dealerScore > 21) return 'Dealer Busted! You Win!';
    if (playerScore > dealerScore) return 'You Win!';
    if (playerScore < dealerScore) return 'Dealer Wins!';
    return 'Push (Tie)!';
  };

  return (
    <div className="blackjack-game">
      <button className="back-button" onClick={onBack}>← Back to Menu</button>
      
      <div className="blackjack-container">
        <div className="blackjack-header">
          <h1>Black Jack</h1>
          <button onClick={startGame} className="new-game-btn" disabled={gameStatus === 'playing' || gameStatus === 'dealer'}>
            New Game
          </button>
        </div>

        {gameStatus === 'finished' && showNameInput && (
          <div className="score-modal">
            <h2>{getGameResult()}</h2>
            {playerScore <= 21 && (dealerScore > 21 || playerScore > dealerScore) && (
              <>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="name-input"
                />
                <button onClick={handleSaveScore} className="save-score-btn">Save Score</button>
              </>
            )}
          </div>
        )}

        <div className="dealer-section">
          <h2>Dealer ({dealerHidden ? '?' : dealerScore})</h2>
          <div className="cards-display">
            {dealerHand.map((card, index) => (
              <div key={card.id} className="card">
                {dealerHidden && index === 1 ? (
                  <div className="card-back">🂠</div>
                ) : (
                  <>
                    <span className={`rank ${card.suit === '♥' || card.suit === '♦' ? 'red' : ''}`}>
                      {card.rank}
                    </span>
                    <span className={`suit ${card.suit === '♥' || card.suit === '♦' ? 'red' : ''}`}>
                      {card.suit}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="player-section">
          <h2>Player ({playerScore})</h2>
          <div className="cards-display">
            {playerHand.map(card => (
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
        </div>

        {gameStatus === 'betting' && (
          <div className="game-actions">
            <button onClick={startGame} className="action-btn">Deal Cards</button>
          </div>
        )}

        {gameStatus === 'playing' && (
          <div className="game-actions">
            <button onClick={hit} className="action-btn">Hit</button>
            <button onClick={stand} className="action-btn">Stand</button>
          </div>
        )}

        {gameStatus === 'finished' && (
          <div className="game-result">
            <h2>{getGameResult()}</h2>
          </div>
        )}

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

export default BlackJack;

