(() => {
  'use strict';
  const CHANNELS = [
    {id: 'en/live-tv/channel-english', title: 'DW English', language: 'English'},
    {id: 'es/live-tv/channel-spanish', title: 'DW Spanish', language: 'Spanish'},
    {id: 'ar/live-tv/channel-arabic', title: 'DW Arabic', language: 'Arabic'}
  ];
  const LOGO = 'https://www.dw.com/images/icons/favicon-180x180.png';
  function requireChannel(id) {
    const normalized = String(id).replace(/^https:\/\/www\.dw\.com\//, '').replace(/^\//, '');
    const channel = CHANNELS.find(c => c.id === normalized);
    if (!channel) throw new Error('Unknown live channel');
    return channel;
  }
  async function text(url) {
    const r = await fetchv2(url, {}, 'GET', null, {timeoutMs: 6000});
    const status = Number(r.status || r.statusCode);
    if (status !== 200) throw new Error('Live source HTTP ' + status);
    const body = typeof r.body === 'string' ? r.body : typeof r.text === 'function' ? await r.text() : '';
    if (!body || body.length > 1048576) throw new Error('Invalid live response');
    return body;
  }
  function mediaUrl(value) {
    // Only the public broadcaster's observed CDN, never an arbitrary page URL.
    if (!/^https:\/\/dwamdstream\d+\.akamaized\.net\/hls\/live\/[a-zA-Z0-9_./-]+\.m3u8$/.test(value)) {
      throw new Error('Unrecognized broadcaster stream');
    }
    return value;
  }
  async function liveHome() {
    return {items: CHANNELS.map(c => ({id: c.id, title: c.title, category: 'News', kind: 'channel',
      imageUrl: LOGO, language: c.language, status: 'unknown'}))};
  }
  function card(c) { return {id: c.id, url: 'https://www.dw.com/' + c.id, title: c.title, posterUrl: LOGO,
    description: c.language + '-language news channel', subAvailable: true, dubAvailable: false}; }
  async function searchResults(query) {
    const q = String(query || '').toLowerCase().trim();
    return CHANNELS.filter(c => !q || (c.title + ' news live').toLowerCase().includes(q)).map(card);
  }
  async function extractDetails(id) {return card(requireChannel(id));}
  async function extractEpisodes(id) {
    const c = requireChannel(id);
    return [{id: c.id, href: c.id, seriesId: c.id, title: c.title,
      number: 1, episodeNumber: 1, subAvailable: true, dubAvailable: false}];
  }
  async function extractStreamUrl(id, lang) {
    const c = requireChannel(id);
    if (lang === 'dub') throw new Error('This channel does not expose a dub mode');
    // Resolve the broadcaster's current source on every play and retry.
    const html = await text('https://www.dw.com/' + c.id);
    const match = html.match(/"hlsVideoSrc"\s*:\s*("(?:[^"\\]|\\.)*")/);
    if (!match) throw new Error('No public HLS source returned');
    const url = mediaUrl(JSON.parse(match[1]));
    const master = await text(url);
    if (!master.trimStart().startsWith('#EXTM3U')) throw new Error('Invalid HLS manifest');
    const rows = master.split(/\r?\n/);
    const variants = [];
    for (let i = 0; i < rows.length - 1; i++) {
      if (!rows[i].startsWith('#EXT-X-STREAM-INF:') || !/avc1|hvc1|hev1/.test(rows[i])) continue;
      const height = Number((rows[i].match(/RESOLUTION=\d+x(\d+)/) || [])[1]);
      const candidate = mediaUrl(rows[i + 1].trim());
      if (!variants.some(v => v.height === height)) variants.push({url: candidate, height});
    }
    if (!variants.length) throw new Error('No video renditions returned');
    const playlist = await text(variants[0].url);
    if (!playlist.trimStart().startsWith('#EXTM3U') || !playlist.includes('#EXTINF:') ||
        playlist.includes('#EXT-X-ENDLIST') || /\.(?:jpg|jpeg|png|webp)(?:[?\s]|$)/i.test(playlist)) {
      throw new Error('Source is not an active live video playlist');
    }
    // Retain the master so the player gets adaptive quality and native HLS captions.
    return {url, type: 'hls', isLive: true, subtitles: [], headers: {}};
  }
  Object.assign(globalThis, {liveHome, searchResults, extractDetails, extractEpisodes, extractStreamUrl});
})();
