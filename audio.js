/* ─── Neuro Noise — Spotify-style client ───────────────────────── */

(function () {
  'use strict';

  // ── Song database ────────────────────────────────────────────────
  // To add more songs: push objects into the SONGS array.
  // Fields: id, title, artist, src (mp3 file), art (image file)
  // Set src/art to null for placeholder cards.
  const SONGS = [
    { id: 'x1',  title: 'Xander Diss',  artist: 'Xander', src: 'xander1.mp3', art: 'xander1.png' },
    { id: 'x2',  title: 'Coming Soon',  artist: 'Xander', src: null, art: null },
    { id: 'x3',  title: 'Coming Soon',  artist: 'Xander', src: null, art: null },
    { id: 'x4',  title: 'Coming Soon',  artist: 'Xander', src: null, art: null },
    { id: 'b1',  title: 'Bailey Diss',  artist: 'Bailey', src: 'bailey1.mp3', art: 'bailey1.png' },
    { id: 'b2',  title: 'Coming Soon',  artist: 'Bailey', src: null, art: null },
    { id: 'b3',  title: 'Coming Soon',  artist: 'Bailey', src: null, art: null },
    { id: 'lv1', title: 'Coming Soon',  artist: 'Levi',   src: null, art: null },
    { id: 'lv2', title: 'Coming Soon',  artist: 'Levi',   src: null, art: null },
    { id: 'lv3', title: 'Coming Soon',  artist: 'Levi',   src: null, art: null },
    { id: 'h1',  title: 'Coming Soon',  artist: 'Hunter', src: null, art: null },
    { id: 'h2',  title: 'Coming Soon',  artist: 'Hunter', src: null, art: null },
    { id: 'h3',  title: 'Coming Soon',  artist: 'Hunter', src: null, art: null },
    { id: 'li1', title: 'Coming Soon',  artist: 'Liam',   src: null, art: null },
    { id: 'li2', title: 'Coming Soon',  artist: 'Liam',   src: null, art: null },
    { id: 'li3', title: 'Coming Soon',  artist: 'Liam',   src: null, art: null },
    { id: 'z1',  title: 'Coming Soon',  artist: 'Zach',   src: null, art: null },
    { id: 'z2',  title: 'Coming Soon',  artist: 'Zach',   src: null, art: null },
    { id: 'z3',  title: 'Coming Soon',  artist: 'Zach',   src: null, art: null },
    { id: 'al1', title: 'Coming Soon',  artist: 'Alex',   src: null, art: null },
    { id: 'al2', title: 'Coming Soon',  artist: 'Alex',   src: null, art: null },
    { id: 'al3', title: 'Coming Soon',  artist: 'Alex',   src: null, art: null },
    { id: 'dy1', title: 'Coming Soon',  artist: 'Dylan',  src: null, art: null },
    { id: 'dy2', title: 'Coming Soon',  artist: 'Dylan',  src: null, art: null },
    { id: 'dy3', title: 'Coming Soon',  artist: 'Dylan',  src: null, art: null },
  ];

  // ── State ────────────────────────────────────────────────────────
  let currentSong    = null;   // song object
  let currentQueue   = [];     // array of song objects (play order)
  let queueIndex     = 0;
  let isShuffled     = false;
  let shuffledQueue  = [];
  let repeatMode     = 'none'; // 'none' | 'all' | 'one'
  let isSeeking      = false;
  let likedSongIds   = new Set(JSON.parse(localStorage.getItem('nn_likes') || '[]'));
  let playlists      = JSON.parse(localStorage.getItem('nn_playlists') || '[]');
  // playlists: [{ id, name, songIds: [] }]
  let activePlaylist = null;   // null = library view
  let ctxTargetSong  = null;
  let editingPlaylistId = null;

  const audio = new Audio();
  audio.preload = 'auto';

  // ── DOM refs ─────────────────────────────────────────────────────
  const playerArtImg    = document.getElementById('playerArtImg');
  const playerTrackName = document.getElementById('playerTrackName');
  const playerTrackArtist = document.getElementById('playerTrackArtist');
  const mainPlayBtn     = document.getElementById('mainPlayBtn');
  const seekSlider      = document.getElementById('seekSlider');
  const seekFill        = document.getElementById('seekFill');
  const seekThumb       = document.getElementById('seekThumb');
  const timeElapsed     = document.getElementById('timeElapsed');
  const timeDuration    = document.getElementById('timeDuration');
  const volSlider       = document.getElementById('volSlider');
  const volFill         = document.getElementById('volFill');
  const volMuteBtn      = document.getElementById('volMuteBtn');
  const heartBtn        = document.getElementById('heartBtn');
  const shuffleBtn      = document.getElementById('shuffleBtn');
  const repeatBtn       = document.getElementById('repeatBtn');
  const queuePanel      = document.getElementById('queuePanel');
  const queueBtn        = document.getElementById('queueBtn');
  const artistSections  = document.getElementById('artistSections');
  const searchInput     = document.getElementById('searchInput');
  const searchClear     = document.getElementById('searchClear');
  const searchResults   = document.getElementById('searchResults');
  const searchResultsList = document.getElementById('searchResultsList');
  const heroSection     = document.getElementById('heroSection');
  const playlistList    = document.getElementById('playlistList');
  const artistFilters   = document.getElementById('artistFilters');
  const playlistModal   = document.getElementById('playlistModal');
  const addToPlaylistModal = document.getElementById('addToPlaylistModal');
  const ctxMenu         = document.getElementById('ctxMenu');
  const content         = document.getElementById('content');

  let lastVol = 1;
  let toastTimer = null;

  // ── Init ─────────────────────────────────────────────────────────
  function init() {
    buildArtistFilters();
    buildArtistSections();
    renderPlaylistSidebar();
    setVolume(1);

    // Close context menu on outside click
    document.addEventListener('click', () => hideCtxMenu());
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { closeModal(); closeAddToPlaylist(); hideCtxMenu(); }
      if (e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      if (e.code === 'ArrowRight') { audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5); }
      if (e.code === 'ArrowLeft')  { audio.currentTime = Math.max(0, audio.currentTime - 5); }
    });
  }

  // ── Build UI ─────────────────────────────────────────────────────
  function buildArtistFilters() {
    const artists = [...new Set(SONGS.map(s => s.artist))];
    artistFilters.innerHTML = '<button class="filter-chip active" data-filter="all" onclick="setFilter(\'all\', this)">All</button>';
    artists.forEach(a => {
      const btn = document.createElement('button');
      btn.className = 'filter-chip';
      btn.dataset.filter = a;
      btn.textContent = a;
      btn.onclick = () => window.setFilter(a, btn);
      artistFilters.appendChild(btn);
    });
  }

  function buildArtistSections(filter = 'all', songs = null) {
    const source = songs || SONGS;
    const artists = [...new Set(source.map(s => s.artist))];
    artistSections.innerHTML = '';

    artists.forEach((artist, ai) => {
      const artistSongs = source.filter(s => s.artist === artist);
      if (filter !== 'all' && filter !== artist) return;

      const sec = document.createElement('section');
      sec.className = 'artist-section';
      sec.style.animationDelay = (ai * 50) + 'ms';

      const realCount = artistSongs.filter(s => s.src).length;

      sec.innerHTML = `
        <div class="artist-section-header">
          <h2 class="section-title">${artist} Diss Tracks</h2>
          ${realCount > 0 ? `<span class="artist-count">${realCount} track${realCount !== 1 ? 's' : ''}</span>` : ''}
        </div>
        <div class="song-list" id="list-${artist}"></div>
      `;

      artistSections.appendChild(sec);

      const list = sec.querySelector('.song-list');
      artistSongs.forEach((song, si) => buildSongRow(song, si + 1, list));
    });
  }

  function buildSongRow(song, num, container, inPlaylist = false) {
    const row = document.createElement('div');
    row.className = 'song-row' + (song.src ? '' : ' placeholder');
    row.dataset.id = song.id;

    if (song.src) {
      row.addEventListener('click', e => {
        if (e.target.closest('.song-row-actions')) return;
        playSong(song);
      });
      row.addEventListener('contextmenu', e => {
        e.preventDefault();
        showCtxMenu(e, song);
      });
    }

    const artHTML = song.art
      ? `<img src="${song.art}" alt="${song.title}" loading="lazy">`
      : `<div class="song-row-placeholder-art"><svg viewBox="0 0 24 24" fill="none"><path d="M9 18V5l12-2v13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="1.5"/></svg></div>`;

    const liked = likedSongIds.has(song.id);

    row.innerHTML = `
      <div class="song-num-wrap">
        <span class="song-num">${num}</span>
        <div class="song-row-play" aria-hidden="true">
          <svg class="mini-play" viewBox="0 0 24 24" fill="none"><path d="M5 3l14 9-14 9V3z" fill="currentColor"/></svg>
          <svg class="mini-pause" viewBox="0 0 24 24" fill="none"><rect x="6" y="4" width="4" height="16" rx="1.5" fill="currentColor"/><rect x="14" y="4" width="4" height="16" rx="1.5" fill="currentColor"/></svg>
        </div>
      </div>
      <div class="song-meta">
        <div class="song-row-art">${artHTML}</div>
        <div class="song-text">
          <div class="song-name">${song.title}</div>
          <div class="song-artist">prod. by Neuro Noise</div>
        </div>
      </div>
      <div class="song-row-actions">
        ${song.src ? `
          <button class="icon-btn heart-icon-btn ${liked ? 'song-liked' : ''}" onclick="toggleLikeSong(event, '${song.id}')" aria-label="Like" title="Like">
            <svg class="heart-icon" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
          </button>
          <button class="icon-btn" onclick="showAddToPlaylist(event, '${song.id}')" aria-label="Add to playlist" title="Add to playlist">
            <svg viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 10h10M4 14h8M17 14v6M14 17h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </button>
          ${inPlaylist ? `<button class="icon-btn" onclick="removeFromCurrentPlaylist(event, '${song.id}')" aria-label="Remove" title="Remove from playlist">
            <svg viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>` : ''}
        ` : ''}
      </div>
      <div class="song-duration" id="dur-${song.id}">—</div>
    `;

    container.appendChild(row);

    // Load duration for real songs
    if (song.src) {
      const tmp = new Audio();
      tmp.preload = 'metadata';
      tmp.src = song.src;
      tmp.addEventListener('loadedmetadata', () => {
        const el = document.getElementById('dur-' + song.id);
        if (el) el.textContent = formatTime(tmp.duration);
      });
    }

    return row;
  }

  // ── Playback ─────────────────────────────────────────────────────
  function playSong(song, queue = null) {
    if (!song || !song.src) return;

    currentSong = song;
    audio.src = song.src;
    audio.load();
    audio.play().catch(console.warn);

    // Set queue
    if (queue) {
      currentQueue = queue;
    } else {
      // default queue = all real songs
      currentQueue = SONGS.filter(s => s.src);
    }
    queueIndex = currentQueue.findIndex(s => s.id === song.id);
    if (isShuffled) rebuildShuffled();

    updatePlayerUI();
    updateActiveSongRows();
    renderQueuePanel();
  }

  function updatePlayerUI() {
    if (!currentSong) return;
    playerTrackName.textContent = currentSong.title;
    playerTrackArtist.textContent = currentSong.artist + ' · prod. by Neuro Noise';

    // Art
    playerArtImg.classList.remove('loaded');
    if (currentSong.art) {
      playerArtImg.src = currentSong.art;
      playerArtImg.onload = () => playerArtImg.classList.add('loaded');
    } else {
      playerArtImg.src = '';
    }

    // Heart
    heartBtn.classList.toggle('liked', likedSongIds.has(currentSong.id));
  }

  function updateActiveSongRows() {
    document.querySelectorAll('.song-row').forEach(row => {
      row.classList.toggle('active', currentSong && row.dataset.id === currentSong.id);
    });
  }

  window.togglePlay = function () {
    if (!currentSong) {
      // Play first real song
      const first = SONGS.find(s => s.src);
      if (first) playSong(first);
      return;
    }
    if (audio.paused) audio.play().catch(console.warn);
    else audio.pause();
  };

  window.nextTrack = function () {
    const queue = isShuffled ? shuffledQueue : currentQueue;
    if (!queue.length) return;
    let next = queueIndex + 1;
    if (next >= queue.length) {
      if (repeatMode === 'all') next = 0;
      else return;
    }
    queueIndex = next;
    playSong(queue[queueIndex], currentQueue);
  };

  window.prevTrack = function () {
    if (audio.currentTime > 3) { audio.currentTime = 0; return; }
    const queue = isShuffled ? shuffledQueue : currentQueue;
    if (!queue.length) return;
    let prev = queueIndex - 1;
    if (prev < 0) prev = repeatMode === 'all' ? queue.length - 1 : 0;
    queueIndex = prev;
    playSong(queue[queueIndex], currentQueue);
  };

  window.toggleShuffle = function () {
    isShuffled = !isShuffled;
    shuffleBtn.classList.toggle('active', isShuffled);
    if (isShuffled) rebuildShuffled();
    showToast(isShuffled ? 'Shuffle on' : 'Shuffle off');
  };

  function rebuildShuffled() {
    shuffledQueue = [...currentQueue].sort(() => Math.random() - 0.5);
    // Put current song first in shuffle queue
    if (currentSong) {
      const idx = shuffledQueue.findIndex(s => s.id === currentSong.id);
      if (idx > 0) {
        shuffledQueue.splice(idx, 1);
        shuffledQueue.unshift(currentSong);
      }
      queueIndex = 0;
    }
  }

  window.toggleRepeat = function () {
    const modes = ['none', 'all', 'one'];
    repeatMode = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    repeatBtn.classList.toggle('active', repeatMode !== 'none');
    const labels = { none: 'Repeat off', all: 'Repeat all', one: 'Repeat one' };
    showToast(labels[repeatMode]);
  };

  // Audio events
  audio.addEventListener('play',  () => mainPlayBtn.classList.add('playing'));
  audio.addEventListener('pause', () => mainPlayBtn.classList.remove('playing'));
  audio.addEventListener('ended', () => {
    if (repeatMode === 'one') { audio.currentTime = 0; audio.play(); return; }
    nextTrack();
  });

  audio.addEventListener('timeupdate', () => {
    if (isSeeking || !audio.duration) return;
    const pct = audio.currentTime / audio.duration;
    seekFill.style.width  = (pct * 100) + '%';
    seekThumb.style.left  = (pct * 100) + '%';
    seekSlider.value       = pct * 1000;
    timeElapsed.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener('loadedmetadata', () => {
    timeDuration.textContent = formatTime(audio.duration);
  });

  // ── Seek bar ─────────────────────────────────────────────────────
  seekSlider.addEventListener('mousedown', () => { isSeeking = true; });
  seekSlider.addEventListener('touchstart', () => { isSeeking = true; }, { passive: true });

  seekSlider.addEventListener('input', () => {
    const pct = seekSlider.value / 1000;
    seekFill.style.width = (pct * 100) + '%';
    seekThumb.style.left = (pct * 100) + '%';
    timeElapsed.textContent = formatTime(pct * (audio.duration || 0));
  });

  function commitSeek() {
    isSeeking = false;
    if (audio.duration) {
      audio.currentTime = (seekSlider.value / 1000) * audio.duration;
    }
  }

  seekSlider.addEventListener('mouseup',   commitSeek);
  seekSlider.addEventListener('touchend',  commitSeek);
  seekSlider.addEventListener('change',    commitSeek);

  // ── Volume ───────────────────────────────────────────────────────
  function setVolume(v) {
    audio.volume = v;
    audio.muted = false;
    volSlider.value = v * 100;
    volFill.style.width = (v * 100) + '%';
    if (v === 0) {
      volMuteBtn.classList.add('muted');
      volMuteBtn.classList.remove('low');
    } else {
      volMuteBtn.classList.remove('muted');
      volMuteBtn.classList.toggle('low', v < 0.4);
      lastVol = v;
    }
  }

  volSlider.addEventListener('input', () => {
    setVolume(parseFloat(volSlider.value) / 100);
  });

  window.toggleMute = function () {
    if (audio.muted || audio.volume === 0) {
      setVolume(lastVol > 0 ? lastVol : 1);
    } else {
      lastVol = audio.volume;
      audio.muted = true;
      volSlider.value = 0;
      volFill.style.width = '0%';
      volMuteBtn.classList.add('muted');
      volMuteBtn.classList.remove('low');
    }
  };

  // ── Like ─────────────────────────────────────────────────────────
  window.toggleLike = function () {
    if (!currentSong) return;
    toggleLikeSong(null, currentSong.id);
    heartBtn.classList.toggle('liked', likedSongIds.has(currentSong.id));
  };

  window.toggleLikeSong = function (e, id) {
    if (e) e.stopPropagation();
    if (likedSongIds.has(id)) likedSongIds.delete(id);
    else likedSongIds.add(id);
    localStorage.setItem('nn_likes', JSON.stringify([...likedSongIds]));
    // Update all heart buttons for this song
    document.querySelectorAll('.heart-icon-btn[onclick*="' + id + '"]').forEach(btn => {
      btn.classList.toggle('song-liked', likedSongIds.has(id));
    });
    if (currentSong && currentSong.id === id) {
      heartBtn.classList.toggle('liked', likedSongIds.has(id));
    }
    showToast(likedSongIds.has(id) ? 'Added to Liked Songs' : 'Removed from Liked Songs');
  };

  // ── Filter ───────────────────────────────────────────────────────
  window.setFilter = function (filter, btn) {
    // Update active states
    document.querySelectorAll('.filter-chip, .nav-item[data-filter]').forEach(el => {
      el.classList.toggle('active', el.dataset.filter === filter);
    });

    // Back to library view
    activePlaylist = null;
    heroSection.classList.remove('hidden');
    searchResults.classList.add('hidden');
    searchInput.value = '';
    searchClear.classList.remove('visible');

    buildArtistSections(filter);

    // Scroll to top
    content.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Search ───────────────────────────────────────────────────────
  window.openSearch = function () {
    searchInput.focus();
  };

  window.handleSearch = function (query) {
    const q = query.trim().toLowerCase();
    searchClear.classList.toggle('visible', q.length > 0);

    if (!q) {
      searchResults.classList.add('hidden');
      heroSection.classList.remove('hidden');
      artistSections.classList.remove('hidden');
      return;
    }

    heroSection.classList.add('hidden');
    artistSections.classList.add('hidden');
    searchResults.classList.remove('hidden');

    const matches = SONGS.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q)
    );

    searchResultsList.innerHTML = '';
    if (matches.length === 0) {
      searchResultsList.innerHTML = '<p style="color:var(--text-dim);font-size:14px;padding:20px 0;">No results found.</p>';
    } else {
      matches.forEach((song, i) => buildSongRow(song, i + 1, searchResultsList));
    }
  };

  window.clearSearch = function () {
    searchInput.value = '';
    window.handleSearch('');
    searchInput.focus();
  };

  window.searchFocused = function () {
    document.getElementById('searchBox').classList.add('focused');
  };

  window.searchBlurred = function () {
    document.getElementById('searchBox').classList.remove('focused');
  };

  // ── Play all / Shuffle all ───────────────────────────────────────
  window.playAll = function () {
    const realSongs = SONGS.filter(s => s.src);
    if (!realSongs.length) return;
    isShuffled = false;
    shuffleBtn.classList.remove('active');
    playSong(realSongs[0], realSongs);
  };

  window.shuffleAll = function () {
    const realSongs = SONGS.filter(s => s.src);
    if (!realSongs.length) return;
    isShuffled = true;
    shuffleBtn.classList.add('active');
    const shuffled = [...realSongs].sort(() => Math.random() - 0.5);
    playSong(shuffled[0], realSongs);
  };

  // ── Queue panel ──────────────────────────────────────────────────
  window.toggleQueue = function () {
    const open = queuePanel.classList.toggle('open');
    queueBtn.classList.toggle('active', open);
    if (open) renderQueuePanel();
  };

  function renderQueuePanel() {
    const nowEl = document.getElementById('queueNowPlaying');
    const nextEl = document.getElementById('queueNextUp');
    nowEl.innerHTML = '';
    nextEl.innerHTML = '';

    if (currentSong) {
      nowEl.appendChild(buildQueueItem(currentSong, true));
    }

    const queue = isShuffled ? shuffledQueue : currentQueue;
    const upcoming = queue.slice(queueIndex + 1, queueIndex + 11);
    upcoming.forEach(s => nextEl.appendChild(buildQueueItem(s, false)));

    if (!upcoming.length) {
      nextEl.innerHTML = '<p style="color:var(--text-dim);font-size:13px;padding:8px 20px;">Nothing up next.</p>';
    }
  }

  function buildQueueItem(song, isCurrent) {
    const div = document.createElement('div');
    div.className = 'queue-song' + (isCurrent ? ' current' : '');
    div.innerHTML = `
      <div class="queue-song-art">${song.art ? `<img src="${song.art}" alt="">` : ''}</div>
      <div class="queue-song-text">
        <div class="queue-song-name">${song.title}</div>
        <div class="queue-song-artist">${song.artist}</div>
      </div>
    `;
    if (!isCurrent) div.addEventListener('click', () => playSong(song));
    return div;
  }

  // ── Playlists ────────────────────────────────────────────────────
  function renderPlaylistSidebar() {
    // Keep new playlist button, then add playlist items
    const newBtn = playlistList.querySelector('.playlist-item');
    playlistList.innerHTML = '';
    playlistList.appendChild(newBtn);

    playlists.forEach(pl => {
      const btn = document.createElement('button');
      btn.className = 'playlist-item' + (activePlaylist && activePlaylist.id === pl.id ? ' active' : '');
      const songs = pl.songIds.map(id => SONGS.find(s => s.id === id)).filter(Boolean);
      const firstArt = songs.find(s => s.art);

      btn.innerHTML = `
        <div class="playlist-icon">
          ${firstArt ? `<img src="${firstArt.art}" alt="">` : `<svg viewBox="0 0 24 24" fill="none"><path d="M9 18V5l12-2v13" stroke="currentColor" stroke-width="1.5"/><circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="1.5"/></svg>`}
        </div>
        <span class="playlist-item-name">${pl.name}</span>
      `;
      btn.addEventListener('click', () => showPlaylist(pl));
      playlistList.appendChild(btn);
    });
  }

  function showPlaylist(pl) {
    activePlaylist = pl;
    artistSections.innerHTML = '';
    heroSection.classList.add('hidden');
    searchResults.classList.add('hidden');

    // Update sidebar active states
    document.querySelectorAll('.filter-chip, .nav-item[data-filter]').forEach(el => el.classList.remove('active'));
    renderPlaylistSidebar();

    const songs = pl.songIds.map(id => SONGS.find(s => s.id === id)).filter(Boolean);
    const realSongs = songs.filter(s => s.src);

    const sec = document.createElement('section');
    sec.className = 'artist-section playlist-view';

    // Build mosaic art for playlist header
    const artImages = [...new Set(songs.filter(s => s.art).map(s => s.art))].slice(0, 4);
    const artHTML = artImages.map(a => `<img src="${a}" alt="">`).join('');

    sec.innerHTML = `
      <div class="playlist-hero">
        <div class="playlist-hero-art">${artHTML || '<svg viewBox="0 0 24 24" fill="none" style="width:48px;height:48px;color:var(--text-dim)"><path d="M9 18V5l12-2v13" stroke="currentColor" stroke-width="1.5"/><circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="1.5"/></svg>'}</div>
        <div class="playlist-hero-info">
          <div class="playlist-hero-type">Playlist</div>
          <h1 class="playlist-hero-name">${pl.name}</h1>
          <p class="playlist-hero-count">${songs.length} song${songs.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
      <div class="playlist-actions">
        ${realSongs.length ? `
          <button class="btn-play-all" onclick="playPlaylist('${pl.id}')">
            <svg viewBox="0 0 24 24" fill="none"><path d="M5 3l14 9-14 9V3z" fill="currentColor"/></svg>
            Play
          </button>
        ` : ''}
        <button class="playlist-delete-btn" onclick="deletePlaylist('${pl.id}')">Delete Playlist</button>
      </div>
      <div class="song-list" id="playlist-songs"></div>
    `;

    artistSections.appendChild(sec);

    const list = sec.querySelector('#playlist-songs');
    if (songs.length === 0) {
      list.innerHTML = '<p style="color:var(--text-dim);font-size:14px;padding:8px 32px;">No songs yet. Add some from the library!</p>';
    } else {
      songs.forEach((song, i) => buildSongRow(song, i + 1, list, true));
    }

    content.scrollTo({ top: 0, behavior: 'smooth' });
  }

  window.playPlaylist = function (id) {
    const pl = playlists.find(p => p.id === id);
    if (!pl) return;
    const songs = pl.songIds.map(sid => SONGS.find(s => s.id === sid)).filter(s => s && s.src);
    if (!songs.length) return;
    playSong(songs[0], songs);
  };

  window.deletePlaylist = function (id) {
    if (!confirm('Delete this playlist?')) return;
    playlists = playlists.filter(p => p.id !== id);
    savePlaylists();
    renderPlaylistSidebar();
    activePlaylist = null;
    heroSection.classList.remove('hidden');
    buildArtistSections();
    showToast('Playlist deleted');
  };

  window.removeFromCurrentPlaylist = function (e, songId) {
    e.stopPropagation();
    if (!activePlaylist) return;
    activePlaylist.songIds = activePlaylist.songIds.filter(id => id !== songId);
    playlists = playlists.map(p => p.id === activePlaylist.id ? activePlaylist : p);
    savePlaylists();
    renderPlaylistSidebar();
    showPlaylist(activePlaylist);
    showToast('Removed from playlist');
  };

  // New/Edit playlist modal
  window.openNewPlaylist = function () {
    editingPlaylistId = null;
    document.getElementById('modalTitle').textContent = 'New Playlist';
    document.getElementById('savePlaylistBtn').textContent = 'Create';
    document.getElementById('playlistNameInput').value = '';
    buildModalSongList([]);
    playlistModal.classList.remove('hidden');
    setTimeout(() => document.getElementById('playlistNameInput').focus(), 100);
  };

  function buildModalSongList(checkedIds) {
    const list = document.getElementById('modalSongList');
    list.innerHTML = '';
    SONGS.filter(s => s.src).forEach(song => {
      const label = document.createElement('label');
      label.className = 'modal-song-check';
      label.innerHTML = `
        <input type="checkbox" value="${song.id}" ${checkedIds.includes(song.id) ? 'checked' : ''}>
        <div class="modal-song-check-art">${song.art ? `<img src="${song.art}" alt="">` : ''}</div>
        <div>
          <div class="modal-song-check-name">${song.title}</div>
          <div class="modal-song-check-artist">${song.artist}</div>
        </div>
      `;
      list.appendChild(label);
    });
  }

  window.savePlaylist = function () {
    const name = document.getElementById('playlistNameInput').value.trim() || 'My Playlist';
    const checked = [...document.querySelectorAll('#modalSongList input:checked')].map(el => el.value);

    if (editingPlaylistId) {
      const pl = playlists.find(p => p.id === editingPlaylistId);
      if (pl) { pl.name = name; pl.songIds = checked; }
    } else {
      playlists.push({ id: 'pl_' + Date.now(), name, songIds: checked });
    }

    savePlaylists();
    renderPlaylistSidebar();
    closeModal();
    showToast(editingPlaylistId ? 'Playlist updated' : 'Playlist created');
  };

  window.closeModal = function () {
    playlistModal.classList.add('hidden');
  };

  function savePlaylists() {
    localStorage.setItem('nn_playlists', JSON.stringify(playlists));
  }

  // Add-to-playlist modal
  window.showAddToPlaylist = function (e, songId) {
    e.stopPropagation();
    ctxTargetSong = SONGS.find(s => s.id === songId);
    openAddToPlaylist();
  };

  function openAddToPlaylist() {
    const body = document.getElementById('addToPlaylistBody');
    body.innerHTML = '';

    if (playlists.length === 0) {
      body.innerHTML = '<p style="color:var(--text-dim);font-size:13px;padding:8px 0;">No playlists yet.<br>Create one first!</p>';
    } else {
      playlists.forEach(pl => {
        const btn = document.createElement('button');
        btn.className = 'modal-playlist-item';
        const songs = pl.songIds.map(id => SONGS.find(s => s.id === id)).filter(Boolean);
        const firstArt = songs.find(s => s.art);
        btn.innerHTML = `
          <div class="playlist-icon">
            ${firstArt ? `<img src="${firstArt.art}" alt="">` : `<svg viewBox="0 0 24 24" fill="none"><path d="M9 18V5l12-2v13" stroke="currentColor" stroke-width="1.5"/><circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="1.5"/></svg>`}
          </div>
          <span>${pl.name}</span>
        `;
        btn.addEventListener('click', () => {
          addSongToPlaylist(ctxTargetSong.id, pl.id);
          closeAddToPlaylist();
        });
        body.appendChild(btn);
      });
    }

    addToPlaylistModal.classList.remove('hidden');
  }

  function addSongToPlaylist(songId, playlistId) {
    const pl = playlists.find(p => p.id === playlistId);
    if (!pl) return;
    if (pl.songIds.includes(songId)) {
      showToast('Already in playlist');
      return;
    }
    pl.songIds.push(songId);
    savePlaylists();
    renderPlaylistSidebar();
    showToast('Added to ' + pl.name);
  }

  window.closeAddToPlaylist = function () {
    addToPlaylistModal.classList.add('hidden');
  };

  // ── Context menu ─────────────────────────────────────────────────
  function showCtxMenu(e, song) {
    ctxTargetSong = song;
    const menu = ctxMenu;
    menu.classList.remove('hidden');
    // Position it
    let x = e.clientX, y = e.clientY;
    const W = window.innerWidth, H = window.innerHeight;
    if (x + 200 > W) x = W - 210;
    if (y + 200 > H) y = H - 210;
    menu.style.left = x + 'px';
    menu.style.top  = y + 'px';
    e.stopPropagation();
  }

  function hideCtxMenu() {
    ctxMenu.classList.add('hidden');
  }

  window.ctxPlay = function () {
    if (ctxTargetSong) playSong(ctxTargetSong);
  };

  window.ctxPlayNext = function () {
    if (!ctxTargetSong) return;
    const idx = currentQueue.findIndex(s => s.id === (currentSong && currentSong.id));
    if (idx >= 0) {
      currentQueue.splice(idx + 1, 0, ctxTargetSong);
    } else {
      currentQueue.unshift(ctxTargetSong);
    }
    showToast('Playing next: ' + ctxTargetSong.title);
  };

  window.ctxAddToQueue = function () {
    if (!ctxTargetSong) return;
    if (!currentQueue.length) {
      playSong(ctxTargetSong);
      return;
    }
    currentQueue.push(ctxTargetSong);
    showToast('Added to queue');
  };

  window.ctxAddToPlaylist = function () {
    if (!ctxTargetSong) return;
    openAddToPlaylist();
  };

  window.ctxLike = function () {
    if (ctxTargetSong) window.toggleLikeSong(null, ctxTargetSong.id);
  };

  // ── Sidebar toggle (mobile) ──────────────────────────────────────
  window.toggleSidebar = function () {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('mobile-open');
  };

  // ── Toast ────────────────────────────────────────────────────────
  let toastEl = null;

  function showToast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  // ── Utilities ────────────────────────────────────────────────────
  function formatTime(s) {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  // ── Start ────────────────────────────────────────────────────────
  init();

})();
