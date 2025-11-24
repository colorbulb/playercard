import { useState } from 'react';
import GameSelection from './components/GameSelection';
import Big2 from './components/games/Big2';
import MemoryGrid from './components/games/MemoryGrid';
import MemoryGridIcons from './components/games/MemoryGridIcons';
import ColorBalls from './components/games/ColorBalls';
import Sudoku from './components/games/Sudoku';
import Takuzu from './components/games/Takuzu';
import Set from './components/games/Set';
import Minesweeper from './components/games/Minesweeper';
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
      ) : currentGame === 'memory' ? (
        <MemoryGrid difficulty={difficulty} onBack={handleBackToMenu} />
      ) : currentGame === 'memory-icons' ? (
        <MemoryGridIcons difficulty={difficulty} onBack={handleBackToMenu} />
      ) : currentGame === 'colorballs' ? (
        <ColorBalls onBack={handleBackToMenu} />
      ) : currentGame === 'sudoku' ? (
        <Sudoku onBack={handleBackToMenu} />
      ) : currentGame === 'takuzu' ? (
        <Takuzu onBack={handleBackToMenu} />
      ) : currentGame === 'set' ? (
        <Set onBack={handleBackToMenu} />
      ) : currentGame === 'minesweeper' ? (
        <Minesweeper onBack={handleBackToMenu} />
      ) : null}
    </div>
  );
}

export default App;

