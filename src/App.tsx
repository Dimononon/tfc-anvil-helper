import React from 'react';
import { Header } from './components/Header';
import { SolverView } from './components/SolverView';

export const App: React.FC = () => {
  return (
    <>
      <Header />
      <main className="app-main">
        <SolverView />
      </main>
      <footer className="app-footer">
        TFC Anvil Helper &bull; TerraFirmaCraft Crafting Optimizer &bull; Minimal Info Mode V1
      </footer>
    </>
  );
};

export default App;

