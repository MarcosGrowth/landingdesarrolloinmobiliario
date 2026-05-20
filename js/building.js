(function () {
  'use strict';

  const tower    = document.getElementById('tower');
  const crane    = document.getElementById('crane');
  const floors   = Array.from(document.querySelectorAll('.floor'));
  const base     = document.querySelector('.tower-base');
  const steps    = Array.from(document.querySelectorAll('.step-item'));

  if (!tower || !floors.length) return;

  let animating = false;

  const FLOOR_H    = 34;
  const BASE_H     = 12;
  const FLOOR_GAP  = 2;
  const DELAY_MS   = 180;

  function getStepIndex(floorIndex) {
    if (floorIndex < 3)  return 0;
    if (floorIndex < 6)  return 1;
    if (floorIndex < 9)  return 2;
    return 3;
  }

  function buildTower() {
    if (animating) return;
    animating = true;

    if (base) {
      setTimeout(() => base.classList.add('built'), 0);
    }

    floors.forEach((floor, i) => {
      setTimeout(() => {
        floor.classList.add('built');

        const craneBottom = BASE_H + (i + 1) * (FLOOR_H + FLOOR_GAP) + 28;
        if (crane) crane.style.bottom = craneBottom + 'px';

        const stepIdx = getStepIndex(i);
        if (steps[stepIdx]) steps[stepIdx].classList.add('active');
      }, (i + 1) * DELAY_MS);
    });

    const totalDelay = (floors.length + 1) * DELAY_MS + 200;
    setTimeout(() => {
      if (crane) {
        crane.style.opacity = '0';
        crane.style.transition = 'opacity 0.5s ease';
      }
      steps.forEach(s => s.classList.add('active'));
    }, totalDelay + 800);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          buildTower();
          observer.disconnect();
        }
      });
    },
    { threshold: 0.2 }
  );

  observer.observe(tower);
})();
