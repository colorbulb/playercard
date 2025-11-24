import { useState } from 'react';
import GameSelection from './components/GameSelection';
import Big2 from './components/games/Big2';
import BlackJack from './components/games/BlackJack';
import MemoryGrid from './components/games/MemoryGrid';
import './App.css';

function App() {
  const [currentGame, setCurrentGame] = useState(null);
  const [difficulty, setDifficulty] = useState(null);

  const handleGameSelect = (game, selectedDifficulty = null) => {
    setCurrentGame(game);
    setDifficulty(selectedDifficulty);
  };

  const handleBackToMenu = () => {
    setCurrentGame(null);
    setDifficulty(null);
  };

  return (
    <div className="App">
      {!currentGame ? (
        <GameSelection onGameSelect={handleGameSelect} />
      ) : currentGame === 'big2' ? (
        <Big2 onBack={handleBackToMenu} />
      ) : currentGame === 'blackjack' ? (
        <BlackJack onBack={handleBackToMenu} />
      ) : currentGame === 'memory' ? (
        <MemoryGrid difficulty={difficulty} onBack={handleBackToMenu} />
      ) : null}
    </div>
  );
}

export default App;

