const Genius = require("genius-lyrics");
const Client = new Genius.Client(process.env.GENIUS_ACCESS_TOKEN); // load from .env

async function getLyrics(track, artist) {
  try {
    if (!track || !artist) return 'No track info';

    // Search Genius for the song
    const searches = await Client.songs.search(`${track} ${artist}`);
    if (!searches.length) return 'No lyrics found';

    // Take the first match
    const song = searches[0];

    // Get lyrics
    const lyrics = await song.lyrics();
    return lyrics || 'No lyrics found';
  } catch (err) {
    console.error('Lyrics fetch error:', err);
    return 'Error fetching lyrics';
  }
}

module.exports = { getLyrics };
