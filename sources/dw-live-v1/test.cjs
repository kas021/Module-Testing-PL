const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const code = fs.readFileSync(__dirname + '/index.js', 'utf8');
const cdn = 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/';
const master = '#EXTM3U\n#EXT-X-STREAM-INF:CODECS="avc1.4D401F,mp4a.40.2",RESOLUTION=480x270\n' + cdn + 'video.m3u8';
function runtime(respond) {
  const r = vm.createContext({fetchv2: async (url) => ({status: 200, body: await respond(url)})});
  vm.runInContext(code, r);
  return r;
}
function fixture(url) {
  if (url.includes('www.dw.com')) return JSON.stringify({hlsVideoSrc: cdn + 'master.m3u8'});
  if (url.endsWith('master.m3u8')) return master;
  return '#EXTM3U\n#EXT-X-MEDIA-SEQUENCE:400\n#EXTINF:6,\nsegment400.ts';
}
test('full URL details, channel, fresh live resolution keep native HLS master', async () => {
  let calls = 0;
  const r = runtime(url => {calls++; return fixture(url);});
  assert.equal((await r.liveHome()).items[0].kind, 'channel');
  assert.equal((await r.extractDetails('https://www.dw.com/en/live-tv/channel-english')).title, 'DW English');
  for (let n = 0; n < 2; n++) {
    const result = await r.extractStreamUrl('en/live-tv/channel-english', 'sub');
    assert.equal(result.isLive, true);
    assert.equal(result.url, cdn + 'master.m3u8');
  }
  assert.equal(calls, 6);
});
test('unknown channel and dub are rejected', async () => {
  const r = runtime(fixture);
  await assert.rejects(r.extractStreamUrl('wrong', 'sub'), /Unknown/);
  await assert.rejects(r.extractStreamUrl('en/live-tv/channel-english', 'dub'), /dub/);
});
test('all three languages retain their own channel identities', async () => {
  const r = runtime(fixture);
  const entries = (await r.liveHome()).items;
  assert.equal(entries.length, 3);
  for (const e of entries) {
    assert.equal((await r.extractDetails(e.id)).title, e.title);
    assert.equal((await r.extractEpisodes(e.id))[0].href, e.id);
    assert.equal((await r.searchResults(e.language)).length, 1);
  }
});
test('HTML, ended streams and image segments are rejected', async () => {
  for (const body of ['<html>error</html>', '#EXTM3U\n#EXTINF:6,\na.ts\n#EXT-X-ENDLIST', '#EXTM3U\n#EXTINF:6,\nad.png']) {
    const r = runtime(url => url.endsWith('video.m3u8') ? body : fixture(url));
    await assert.rejects(r.extractStreamUrl('en/live-tv/channel-english', 'sub'), /active live/);
  }
});
test('unrelated CDN URLs fail closed', async () => {
  const r = runtime(() => '{"hlsVideoSrc":"https://attacker.example/stream.m3u8"}');
  await assert.rejects(r.extractStreamUrl('en/live-tv/channel-english', 'sub'), /Unrecognized/);
});
