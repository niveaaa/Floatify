// renderer.js
const { electronAPI } = window;

document.addEventListener('DOMContentLoaded', async () => {
  const opacityEl = document.getElementById('opacity');
  const clickthroughEl = document.getElementById('clickthrough');
  const minBtn = document.getElementById('min-btn');
  const closeBtn = document.getElementById('close-btn');

  // initialize opacity from slider
  const initOpacity = parseFloat(opacityEl.value);
  await electronAPI.setOpacity(initOpacity);

  opacityEl.addEventListener('input', async (e) => {
    const v = parseFloat(e.target.value);
    await electronAPI.setOpacity(v);
  });

  clickthroughEl.addEventListener('change', async (e) => {
    const ignore = e.target.checked;
    // When ignore is true, clicks go through window (so underlying app gets clicks).
    await electronAPI.setIgnoreMouse(ignore);
    // give user visible hint in console
    console.log('Click-through', ignore);
  });

  minBtn.addEventListener('click', () => electronAPI.minimize());
  closeBtn.addEventListener('click', () => electronAPI.close());

  // Draggable reposition: user drags header; we capture mouseup releases and update position
  // NOTE: Browser window drag is handled by -webkit-app-region: drag in header; explicit pos persistence can be added later.

  // Play/pause/skip stubs
  document.getElementById('play').addEventListener('click', () => {
    // later: call Spotify play via web API or local media control
    console.log('Play pressed (stub)');
  });
  document.getElementById('pause').addEventListener('click', () => {
    console.log('Pause pressed (stub)');
  });
  document.getElementById('skip').addEventListener('click', () => {
    console.log('Skip pressed (stub)');
  });

  // Sample: change "current" lyric every 3 seconds to emulate sync (demo)
  const lines = Array.from(document.querySelectorAll('.line'));
  let idx = lines.findIndex(l => l.classList.contains('current'));
  if (idx < 0) idx = 0;
  setInterval(() => {
    lines.forEach(l => l.classList.remove('current'));
    idx = (idx + 1) % lines.length;
    lines[idx].classList.add('current');
  }, 3000);
});
