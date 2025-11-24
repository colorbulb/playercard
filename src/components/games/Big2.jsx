import { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, CardBody, CardTitle, CardText, Input } from 'reactstrap';
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
    <Container fluid className="big2-game">
      <Row className="mb-3">
        <Col>
          <Button color="secondary" onClick={onBack}>← Back to Menu</Button>
        </Col>
      </Row>
      
      <Container>
        <Card>
          <CardBody>
            <Row className="align-items-center mb-3">
              <Col md={6}>
                <CardTitle tag="h1">Big 2</CardTitle>
              </Col>
              <Col md={6} className="text-md-end">
                <Button color="primary" onClick={initializeGame}>New Game</Button>
              </Col>
            </Row>

            {gameStatus === 'won' && showNameInput && (
              <Card className="mb-3 bg-light">
                <CardBody className="text-center">
                  <CardTitle tag="h2">Congratulations! You won!</CardTitle>
                  <div className="d-flex gap-2 justify-content-center flex-wrap mt-3">
                    <Input
                      type="text"
                      placeholder="Enter your name"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      style={{ maxWidth: '200px' }}
                    />
                    <Button color="success" onClick={handleSaveScore}>Save Score</Button>
                  </div>
                </CardBody>
              </Card>
            )}

            <Card className="mb-3">
              <CardBody>
                <CardTitle tag="h5">Last Play:</CardTitle>
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
                  <CardText>No plays yet</CardText>
                )}
              </CardBody>
            </Card>

            <Card className="mb-3">
              <CardBody>
                <CardTitle tag="h5">Your Hand ({playerHand.length} cards)</CardTitle>
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
              </CardBody>
            </Card>

            <Row className="mb-3">
              <Col className="text-center">
                <div className="d-flex gap-2 justify-content-center">
                  <Button 
                    color="primary" 
                    size="lg"
                    onClick={playCards} 
                    disabled={selectedCards.length === 0}
                  >
                    Play Cards
                  </Button>
                  <Button color="secondary" size="lg" onClick={pass}>Pass</Button>
                </div>
              </Col>
            </Row>

            <Card>
              <CardBody>
                <CardTitle tag="h5">High Scores</CardTitle>
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
                    <CardText className="text-muted">No scores yet</CardText>
                  )}
                </div>
              </CardBody>
            </Card>
          </CardBody>
        </Card>
      </Container>
    </Container>
  );
}

export default Big2;

