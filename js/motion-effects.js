import { animate, hover, press, inView, stagger } from 'https://cdn.jsdelivr.net/npm/motion@11/+esm';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduceMotion) {
  const SPRING = { type: 'spring', stiffness: 400, damping: 22 };

  document.querySelectorAll('.btn').forEach((btn) => {
    hover(btn, () => {
      animate(btn, { y: -3, scale: 1.02 }, SPRING);
      return () => animate(btn, { y: 0, scale: 1 }, SPRING);
    });

    press(btn, () => {
      animate(btn, { scale: 0.96 }, SPRING);
      return () => animate(btn, { y: 0, scale: 1 }, SPRING);
    });
  });

  /* ── Stagger entrance for card grids ── */
  document.querySelectorAll('.problems-grid, .numbers-grid').forEach((grid) => {
    inView(grid, () => {
      const cards = grid.querySelectorAll('.fi');
      animate(
        cards,
        { opacity: [0, 1], y: [28, 0] },
        { ...SPRING, delay: stagger(0.08) }
      );
    }, { margin: '-40px' });
  });
} else {
  document.querySelectorAll('.problems-grid .fi, .numbers-grid .fi').forEach((card) => {
    card.classList.add('visible');
  });
}
