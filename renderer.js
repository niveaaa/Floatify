window.electronAPI.onTrackUpdate((data) => {
  document.getElementById('track').textContent = data.name || 'No track playing';
  document.getElementById('artist').textContent = data.artist || '';
  document.getElementById('albumArt').src = data.albumArt || '';
});
