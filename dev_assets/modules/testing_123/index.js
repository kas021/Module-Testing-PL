'use strict';

(function () {
  var seriesId = 'testing-123-one-piece';
  var episodeId = 'testing-123-one-piece-s1e1';
  function card() {
    return {
      id: seriesId,
      url: seriesId,
      title: 'One Piece',
      image: '',
      year: 1999,
      description: 'Intentional failure test only. Episode 1 has no video. Use Try another source after the playback error appears.',
      status: 'Ongoing'
    };
  }
  function matches(value, id) {
    var text = String(value || '').split('?')[0].replace(/\/+$/, '');
    return text === id || text === 'https://example.invalid/' + id;
  }

  globalThis.searchResults = async function (query, page) {
    if (Number(page || 0) > 0) return [];
    var q = String(query || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    // "a" is the legacy app's initial catalogue query.
    return !q || q === 'a' || 'onepiece'.indexOf(q) >= 0 ||
      q === 'testing123' ? [card()] : [];
  };
  globalThis.extractDetails = async function (id) {
    if (!matches(id, seriesId)) throw new Error('QA fixture: unknown title');
    return card();
  };
  globalThis.extractEpisodes = async function (id) {
    if (!matches(id, seriesId)) return [];
    return [{
      href: episodeId,
      number: 1,
      season: 1,
      title: 'Episode 1 - Intentional failure test',
      subAvailable: true,
      dubAvailable: true
    }];
  };
  globalThis.extractStreamUrl = async function () {
    // Deliberately fail both language selections and every retry. Never fetch a
    // URL, touch the device, or return a media link that could start a download.
    throw new Error('QA_INTENTIONAL_FAILURE: Testing 1 2 3 deliberately provides no video. Select Try another source.');
  };
})();
