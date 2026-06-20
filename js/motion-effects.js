import { animate, hover, press } from 'https://cdn.jsdelivr.net/npm/motion@11/+esm';

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
