import React, { useEffect } from 'react';
import { Header } from './components/Header';
import { SolverView } from './components/SolverView';

const ASSETS_TO_PRELOAD = [
  '/assets/anvil_tp.png',
  '/assets/anvil_tp_chevron.png',
  '/assets/results.png',
  '/assets/x.png',
  '/assets/hit_light.png',
  '/assets/hit_medium.png',
  '/assets/hit_hard.png',
  '/assets/punch.png',
  '/assets/bend.png',
  '/assets/upset.png',
  '/assets/shrink.png',
  '/assets/draw.png',
  '/assets/empty_hit.png',
  '/assets/empty_draw.png',
  '/assets/empty_punch.png',
  '/assets/empty_bend.png',
  '/assets/empty_upset.png',
  '/assets/empty_shrink.png',
  ...Array.from({ length: 10 }, (_, i) => `/assets/${i}.png`),
];

export const App: React.FC = () => {
  useEffect(() => {
    ASSETS_TO_PRELOAD.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

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

