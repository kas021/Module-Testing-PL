import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';

test('failure fixture has one title/episode and never requests media', async () => {
  let networkCalls = 0;
  const ctx = vm.createContext({
    fetch() { networkCalls++; throw new Error('Network forbidden'); },
    fetchv2() { networkCalls++; throw new Error('Network forbidden'); },
  });
  const source = fs.readFileSync(new URL('../dev_assets/modules/testing_123/index.js', import.meta.url), 'utf8');
  const packaged = execFileSync('unzip', ['-p', new URL('../modules/Testing-1-2-3-1.0.0-beta.1.zip', import.meta.url).pathname, 'index.js'], {encoding:'utf8'});
  assert.equal(packaged, source);
  vm.runInContext(packaged, ctx);
  const titles = await ctx.searchResults('One Piece');
  assert.equal(titles.length, 1);
  assert.equal(titles[0].title, 'One Piece');
  assert.equal((await ctx.searchResults('a')).length, 1);
  assert.equal((await ctx.searchResults('Naruto')).length, 0);
  assert.equal((await ctx.searchResults('One Piece', 1)).length, 0);
  assert.equal((await ctx.extractDetails('https://example.invalid/' + titles[0].id)).title, 'One Piece');
  const episodes = await ctx.extractEpisodes(titles[0].id);
  assert.equal(episodes.length, 1);
  assert.equal(episodes[0].number, 1);
  assert.equal(episodes[0].season, 1);
  assert.equal((await ctx.extractEpisodes('unknown')).length, 0);
  for (const lang of ['sub', 'dub']) {
    for (let retry = 0; retry < 3; retry++) {
      await assert.rejects(ctx.extractStreamUrl(episodes[0].href, lang), /QA_INTENTIONAL_FAILURE/);
    }
  }
  assert.equal(networkCalls, 0);
});
