import { useState } from 'react';
import { Container, Row, Col, Button, Card, CardBody, CardTitle, CardText } from 'reactstrap';
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
    <Container fluid className="game-selection">
      <Row className="mb-4">
        <Col className="text-center">
          <img src={logo} width="300px" alt="Logo" className="mb-3" />
          <h1 className="game-selection-title">NextElite Game Collection</h1>
          <p className="game-selection-subtitle">Choose a game to play</p>
        </Col>
      </Row>
      
      {!showMemoryOptions && !showMemoryDifficulty ? (
        <Row className="g-3">
          <Col md={6} lg={4} xl={3}>
            <Card className="game-card h-100" onClick={() => onGameSelect('blackjack')}>
              <CardBody className="text-center">
                <div className="game-icon">🎰</div>
                <CardTitle tag="h2">Black Jack</CardTitle>
                <CardText>Beat the dealer!</CardText>
              </CardBody>
            </Card>
          </Col>
          
          <Col md={6} lg={4} xl={3}>
            <Card className="game-card h-100" onClick={handleMemoryClick}>
              <CardBody className="text-center">
                <div className="game-icon">🧠</div>
                <CardTitle tag="h2">Memory Grid</CardTitle>
                <CardText>Test your memory</CardText>
              </CardBody>
            </Card>
          </Col>
          
          <Col md={6} lg={4} xl={3}>
            <Card className="game-card h-100" onClick={() => onGameSelect('colorballs')}>
              <CardBody className="text-center">
                <div className="game-icon">🎨</div>
                <CardTitle tag="h2">Color Balls</CardTitle>
                <CardText>Tap matching colors!</CardText>
              </CardBody>
            </Card>
          </Col>
          
          <Col md={6} lg={4} xl={3}>
            <Card className="game-card h-100" onClick={() => onGameSelect('sudoku')}>
              <CardBody className="text-center">
                <div className="game-icon">🔢</div>
                <CardTitle tag="h2">Sudoku</CardTitle>
                <CardText>Number puzzle</CardText>
              </CardBody>
            </Card>
          </Col>
          
          <Col md={6} lg={4} xl={3}>
            <Card className="game-card h-100" onClick={() => onGameSelect('takuzu')}>
              <CardBody className="text-center">
                <div className="game-icon">⚫⚪</div>
                <CardTitle tag="h2">Takuzu</CardTitle>
                <CardText>Binary puzzle</CardText>
              </CardBody>
            </Card>
          </Col>
          
          <Col md={6} lg={4} xl={3}>
            <Card className="game-card h-100" onClick={() => onGameSelect('set')}>
              <CardBody className="text-center">
                <div className="game-icon">🎴</div>
                <CardTitle tag="h2">Set</CardTitle>
                <CardText>Card matching game</CardText>
              </CardBody>
            </Card>
          </Col>
          
          <Col md={6} lg={4} xl={3}>
            <Card className="game-card h-100" onClick={() => onGameSelect('minesweeper')}>
              <CardBody className="text-center">
                <div className="game-icon">💣</div>
                <CardTitle tag="h2">Minesweeper</CardTitle>
                <CardText>Clear the minefield</CardText>
              </CardBody>
            </Card>
          </Col>
        </Row>
      ) : showMemoryOptions ? (
        <Row className="justify-content-center">
          <Col md={8}>
            <Card>
              <CardBody>
                <CardTitle tag="h2" className="text-center mb-4">Choose Memory Game Type</CardTitle>
                <Row className="g-3">
                  <Col md={6}>
                    <Card className="game-card h-100" onClick={() => handleMemoryTypeSelect('memory')}>
                      <CardBody className="text-center">
                        <div className="game-icon">🃏</div>
                        <CardTitle tag="h2">Memory Grid (Cards)</CardTitle>
                        <CardText>Match poker cards</CardText>
                      </CardBody>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="game-card h-100" onClick={() => handleMemoryTypeSelect('memory-icons')}>
                      <CardBody className="text-center">
                        <div className="game-icon">🎯</div>
                        <CardTitle tag="h2">Memory Grid (Icons)</CardTitle>
                        <CardText>Match emoji icons - Landscape mode</CardText>
                      </CardBody>
                    </Card>
                  </Col>
                </Row>
                <div className="text-center mt-4">
                  <Button color="secondary" onClick={() => setShowMemoryOptions(false)}>Back</Button>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      ) : (
        <Row className="justify-content-center">
          <Col md={6}>
            <Card>
              <CardBody>
                <CardTitle tag="h2" className="text-center mb-4">Select Difficulty</CardTitle>
                <div className="d-grid gap-3">
                  <Button 
                    color="success" 
                    size="lg"
                    onClick={() => handleDifficultySelect('easy')}
                  >
                    Easy
                  </Button>
                  <Button 
                    color="warning" 
                    size="lg"
                    onClick={() => handleDifficultySelect('medium')}
                  >
                    Medium
                  </Button>
                  <Button 
                    color="danger" 
                    size="lg"
                    onClick={() => handleDifficultySelect('expert')}
                  >
                    Expert
                  </Button>
                </div>
                <div className="text-center mt-4">
                  <Button 
                    color="secondary" 
                    onClick={() => {
                      setShowMemoryDifficulty(false);
                      setSelectedMemoryType(null);
                    }}
                  >
                    Back
                  </Button>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default GameSelection;

