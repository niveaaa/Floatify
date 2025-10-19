setInterval(async () => {
  try {
    const res = await fetch("http://127.0.0.1:8888/currently-playing");
    const data = await res.json();

    if (data && data.is_playing) {
      console.log(`🎵 ${data.item.name} — ${data.item.artists.map(a => a.name).join(", ")}`);
      console.log(`Progress: ${Math.floor(data.progress_ms / 1000)}s / ${Math.floor(data.item.duration_ms / 1000)}s`);
    } else {
      console.log("Nothing playing or Spotify idle");
    }
  } catch (err) {
    console.error("Polling failed:", err.message);
  }
}, 5000);
