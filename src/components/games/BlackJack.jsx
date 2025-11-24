import { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, CardBody, CardTitle, CardText, Input } from 'reactstrap';
import { saveScore, getHighScores } from '../../firebase/scores';
import LandscapeOverlay from '../LandscapeOverlay';
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

  const startGame = () => {
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
    
    const player = [newDeck[0], newDeck[2]];
    const dealer = [newDeck[1], newDeck[3]];
    const remainingDeck = newDeck.slice(4);
    
    setDeck(remainingDeck);
    setPlayerHand(player);
    setDealerHand(dealer);
    setGameStatus('playing');
    setDealerHidden(true);
    setPlayerScore(calculateHandValue(player));
    setDealerScore(calculateHandValue([dealer[0]])); // Only show first card
  };

  const hit = () => {
    if (gameStatus !== 'playing') return;
    
    setDeck(currentDeck => {
      let newCard;
      let remainingDeck;
      
      if (currentDeck.length === 0) {
        // Reshuffle if needed
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
        
        newCard = newDeck[0];
        remainingDeck = newDeck.slice(1);
      } else {
        newCard = currentDeck[0];
        remainingDeck = currentDeck.slice(1);
      }
      
      setPlayerHand(currentPlayerHand => {
        const newHand = [...currentPlayerHand, newCard];
        const score = calculateHandValue(newHand);
        setPlayerScore(score);
        
        if (score > 21) {
          setGameStatus('finished');
          setDealerHidden(false);
          setDealerHand(currentDealerHand => {
            setDealerScore(calculateHandValue(currentDealerHand));
            return currentDealerHand;
          });
        }
        
        return newHand;
      });
      
      return remainingDeck;
    });
  };

  const stand = () => {
    if (gameStatus !== 'playing') return;
    
    setGameStatus('dealer');
    setDealerHidden(false);
    
    let currentDealerHand = [...dealerHand];
    
    const dealerPlay = () => {
      const currentDealerScore = calculateHandValue(currentDealerHand);
      
      if (currentDealerScore < 17) {
        setDeck(currentDeck => {
          if (currentDeck.length === 0) {
            finishGame(currentDealerHand);
            return currentDeck;
          }
          
          const newCard = currentDeck[0];
          currentDealerHand = [...currentDealerHand, newCard];
          const newScore = calculateHandValue(currentDealerHand);
          setDealerHand(currentDealerHand);
          setDealerScore(newScore);
          
          if (newScore < 17) {
            setTimeout(dealerPlay, 500);
          } else {
            setTimeout(() => finishGame(currentDealerHand), 100);
          }
          
          return currentDeck.slice(1);
        });
      } else {
        finishGame(currentDealerHand);
      }
    };
    
    setTimeout(dealerPlay, 500);
  };

  const finishGame = (finalDealerHand) => {
    setDealerHand(finalDealerHand);
    setGameStatus('finished');
    
    const finalPlayerScore = calculateHandValue(playerHand);
    const finalDealerScore = calculateHandValue(finalDealerHand);
    
    setPlayerScore(finalPlayerScore);
    setDealerScore(finalDealerScore);
    
    if (finalPlayerScore <= 21 && (finalDealerScore > 21 || finalPlayerScore > finalDealerScore)) {
      setShowNameInput(true);
    }
  };

  const loadHighScores = async () => {
    try {
      const scores = await getHighScores('Black Jack');
      setHighScores(scores);
    } catch (error) {
      // Silently handle errors - scores will just be empty
      setHighScores([]);
    }
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
    <>
      <LandscapeOverlay />
      <Container fluid className="blackjack-game">
        <Row className="mb-3">
          <Col>
            <Button color="secondary" onClick={onBack}>← Back to Menu</Button>
          </Col>
        </Row>
        
        <Container>
          <Card>
            <CardBody>
              <Row className="align-items-center mb-4">
                <Col md={6}>
                  <CardTitle tag="h1">Black Jack</CardTitle>
                </Col>
                <Col md={6} className="text-md-end">
                  <Button 
                    color="primary" 
                    onClick={startGame} 
                    disabled={gameStatus === 'playing' || gameStatus === 'dealer'}
                  >
                    New Game
                  </Button>
                </Col>
              </Row>

              {gameStatus === 'finished' && showNameInput && (
                <div className="mb-4 p-3 bg-light rounded text-center">
                  <h2 className="mb-3">{getGameResult()}</h2>
                  {playerScore <= 21 && (dealerScore > 21 || playerScore > dealerScore) && (
                    <div className="d-flex gap-2 justify-content-center flex-wrap">
                      <Input
                        type="text"
                        placeholder="Enter your name"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        style={{ maxWidth: '200px' }}
                      />
                      <Button color="success" onClick={handleSaveScore}>Save Score</Button>
                    </div>
                  )}
                </div>
              )}

              <div className="mb-4 p-4 bg-white rounded">
                <h5 className="mb-3">Dealer ({dealerHidden ? '?' : dealerScore})</h5>
                <div className="cards-display">
                  {dealerHand.map((card, index) => (
                    <div key={card.id} className="playing-card">
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

              <div className="mb-4 p-4 bg-white rounded">
                <h5 className="mb-3">Player ({playerScore})</h5>
                <div className="cards-display">
                  {playerHand.map(card => (
                    <div key={card.id} className="playing-card">
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
                <Row className="mb-4">
                  <Col className="text-center">
                    <Button color="primary" size="lg" onClick={startGame}>Deal Cards</Button>
                  </Col>
                </Row>
              )}

              {gameStatus === 'playing' && (
                <Row className="mb-4">
                  <Col className="text-center">
                    <div className="d-flex gap-2 justify-content-center">
                      <Button color="success" size="lg" onClick={hit}>Hit</Button>
                      <Button color="warning" size="lg" onClick={stand}>Stand</Button>
                    </div>
                  </Col>
                </Row>
              )}

              {gameStatus === 'finished' && !showNameInput && (
                <div className="mb-4 p-3 bg-light rounded text-center">
                  <h2>{getGameResult()}</h2>
                </div>
              )}

              <div className="mt-4">
                <h5 className="mb-3">High Scores</h5>
                <div className="scores-list">
                  {highScores.length > 0 ? (
                    highScores.map((score, index) => (
                      <div key={score.id} className="score-item d-flex justify-content-between align-items-center p-2 mb-2 bg-light rounded">
                        <span className="fw-bold text-primary">#{index + 1}</span>
                        <span className="flex-grow-1 ms-3">{score.playerName}</span>
                        <span className="fw-bold">{score.score}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted">No scores yet</p>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        </Container>
    </Container>
    </>
  );
}

export default BlackJack;

