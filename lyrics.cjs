const fetch = require('node-fetch');

async function getLyrics(track, artist) {
  const accessToken = process.env.GENIUS_ACCESS_TOKEN; // your Genius API token
  const query = encodeURIComponent(`${track} ${artist}`);

  try {
    // Step 1: Search for the song
    const searchUrl = `https://api.genius.com/search?q=${query}`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const searchData = await searchRes.json();

    if (!searchData.response.hits.length) return 'No lyrics found.';

    const songPath = searchData.response.hits[0].result.path;
    const pageUrl = `https://genius.com${songPath}`;

    // Step 2: Scrape lyrics from the Genius song page
    const html = await fetch(pageUrl).then(r => r.text());
    const match = html.match(/<div class="Lyrics__Container[^>]*>([\s\S]*?)<\/div>/g);
    if (!match) return 'No lyrics found.';

    const lyrics = match
      .map(div => div.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&'))
      .join('\n')
      .trim();

    return lyrics || 'No lyrics found.';
  } catch (err) {
    console.error('Lyrics fetch error:', err);
    return 'Error fetching lyrics.';
  }
}

module.exports = { getLyrics };
