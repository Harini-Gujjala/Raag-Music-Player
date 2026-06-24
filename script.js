const API_URL = "https://saavn.sumit.co/api/search/songs?query=";

function loadArray(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return Array.isArray(data) ? data : [];
  } catch {
    localStorage.removeItem(key);
    return [];
  }
}

function saveArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const pages = {
  home: document.getElementById("homePage"),
  search: document.getElementById("searchPage"),
  library: document.getElementById("libraryPage")
};

const sideLinks = document.querySelectorAll(".side-link");
const mobileNavButtons = document.querySelectorAll(".mobile-nav-btn");

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("songResults");
const searchStatus = document.getElementById("searchStatus");

const audioPlayer = document.getElementById("audioPlayer");
const songCover = document.getElementById("songCover");
const songTitle = document.getElementById("songTitle");
const songArtist = document.getElementById("songArtist");
const desktopCover = document.getElementById("desktopCover");
const desktopTitle = document.getElementById("desktopTitle");
const desktopArtist = document.getElementById("desktopArtist");

const playBtn = document.getElementById("playBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const repeatBtn = document.getElementById("repeatBtn");
const progressBar = document.getElementById("progressBar");
const currentTime = document.getElementById("currentTime");
const duration = document.getElementById("duration");
const volumeBar = document.getElementById("volumeBar");

const likeBtn = document.getElementById("likeBtn");
const desktopLikeBtn = document.getElementById("desktopLikeBtn");
const likedSongsContainer = document.getElementById("likedSongs");
const recentSongsContainer = document.getElementById("recentSongs");
const queueSongsContainer = document.getElementById("queueSongs");
const queueHeading = document.getElementById("queueHeading");

const exploreBtn = document.getElementById("exploreBtn");
const mobileSearchBtn = document.getElementById("mobileSearchBtn");
const clearRecentBtn = document.getElementById("clearRecentBtn");
const likedPlaylistBtn = document.getElementById("likedPlaylistBtn");
const recentPlaylistBtn = document.getElementById("recentPlaylistBtn");

const createPlaylistBtn = document.getElementById("createPlaylistBtn");
const libraryCreatePlaylistBtn = document.getElementById("libraryCreatePlaylistBtn");
const playlistModal = document.getElementById("playlistModal");
const closePlaylistModal = document.getElementById("closePlaylistModal");
const playlistForm = document.getElementById("playlistForm");
const playlistNameInput = document.getElementById("playlistNameInput");
const customPlaylists = document.getElementById("customPlaylists");
const playlistGrid = document.getElementById("playlistGrid");

const addSongModal = document.getElementById("addSongModal");
const closeAddSongModalBtn = document.getElementById("closeAddSongModal");
const addSongText = document.getElementById("addSongText");
const playlistChoiceList = document.getElementById("playlistChoiceList");

let queue = [];
let currentIndex = -1;
let currentSong = null;
let isShuffle = false;
let isRepeat = false;
let songToAdd = null;

let likedSongs = loadArray("raagLikedSongs");
let recentSongs = loadArray("raagRecentSongs");
let playlists = loadArray("raagPlaylists");

audioPlayer.volume = Number(volumeBar.value);

/* Navigation */

function changePage(pageName) {
  Object.values(pages).forEach((page) => page.classList.remove("active-page"));
  pages[pageName].classList.add("active-page");

  sideLinks.forEach((button) => {
    button.classList.toggle("active", button.dataset.page === pageName);
  });

  mobileNavButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.page === pageName);
  });

  if (pageName === "library") {
    renderLikedSongs();
    renderPlaylistGrid();
    renderQueue();
  }
}

sideLinks.forEach((button) => {
  button.addEventListener("click", () => changePage(button.dataset.page));
});

mobileNavButtons.forEach((button) => {
  button.addEventListener("click", () => changePage(button.dataset.page));
});

exploreBtn.addEventListener("click", () => {
  changePage("search");
  searchInput.focus();
});

mobileSearchBtn.addEventListener("click", () => {
  changePage("search");
  searchInput.focus();
});

likedPlaylistBtn.addEventListener("click", () => {
  changePage("library");
  likedSongsContainer.scrollIntoView({ behavior: "smooth" });
});

recentPlaylistBtn.addEventListener("click", () => {
  changePage("home");
  recentSongsContainer.scrollIntoView({ behavior: "smooth" });
});

/* Search */

searchForm.addEventListener("submit", searchSongs);

async function searchSongs(event) {
  event.preventDefault();

  const query = searchInput.value.trim();

  if (!query) {
    searchStatus.textContent = "Please enter a song or artist name.";
    return;
  }

  searchStatus.textContent = `Searching for "${query}"...`;
  searchResults.innerHTML = "";

  try {
    const response = await fetch(
      `${API_URL}${encodeURIComponent(query)}&page=0&limit=20`
    );

    if (!response.ok) throw new Error("Search failed");

    const result = await response.json();
    const songs = result?.data?.results || [];

    queue = songs.map(formatSong).filter((song) => song.audio);

    if (queue.length === 0) {
      searchStatus.textContent = "No playable songs found.";
      return;
    }

    currentIndex = -1;
    searchStatus.textContent = `${queue.length} songs found`;
    renderSearchSongs(queue);
    renderQueue();
  } catch (error) {
    console.error(error);
    searchStatus.textContent = "Unable to load songs. Try again.";
  }
}

function formatSong(song) {
  const image =
    song.image?.find((item) => item.quality === "500x500")?.url ||
    song.image?.[song.image.length - 1]?.url ||
    "";

  const audio =
    song.downloadUrl?.find((item) => item.quality === "160kbps")?.url ||
    song.downloadUrl?.[song.downloadUrl.length - 1]?.url ||
    "";

  const artist =
    song.artists?.primary?.map((artist) => artist.name).join(", ") ||
    song.primaryArtists ||
    "Unknown Artist";

  return {
    id: song.id || `${song.name}-${artist}`,
    title: cleanText(song.name || "Untitled Song"),
    artist: cleanText(artist),
    image,
    audio
  };
}

function cleanText(text = "") {
  const temp = document.createElement("div");
  temp.innerHTML = text;
  return temp.textContent || temp.innerText || "";
}

function renderSearchSongs(songs) {
  searchResults.innerHTML = "";
  songs.forEach((song, index) => {
    searchResults.appendChild(createSongCard(song, index));
  });
}

/* Song cards */

function createSongCard(song, index = null) {
  const card = document.createElement("article");
  card.className = "song-card";

  const liked = likedSongs.some((item) => item.id === song.id);

  card.innerHTML = `
    <img src="${song.image}" alt="${song.title} cover">
    <div class="song-card-info">
      <h3>${song.title}</h3>
      <p>${song.artist}</p>
    </div>
    <div class="card-actions">
      <button class="add-playlist-btn" title="Add to playlist">＋</button>
      <button class="card-like-btn" title="Like">${liked ? "♥" : "♡"}</button>
      <button class="play-song-btn" title="Play">▶</button>
    </div>
  `;

  card.querySelector(".play-song-btn").addEventListener("click", (event) => {
    event.stopPropagation();
    if (index !== null) currentIndex = index;
    playSong(song);
  });

  card.querySelector(".card-like-btn").addEventListener("click", (event) => {
    event.stopPropagation();
    toggleLike(song);
    event.currentTarget.textContent = likedSongs.some((item) => item.id === song.id) ? "♥" : "♡";
  });

  card.querySelector(".add-playlist-btn").addEventListener("click", (event) => {
    event.stopPropagation();
    openAddSongModal(song);
  });

  card.addEventListener("click", () => {
    if (index !== null) currentIndex = index;
    playSong(song);
  });

  return card;
}

/* Player */

function playSong(song) {
  if (!song.audio) return;

  currentSong = song;
  audioPlayer.src = song.audio;

  audioPlayer.play()
    .then(() => {
      playBtn.textContent = "❚❚";
    })
    .catch(() => {
      playBtn.textContent = "▶";
    });

  songCover.src = song.image;
  songTitle.textContent = song.title;
  songArtist.textContent = song.artist;

  desktopCover.src = song.image;
  desktopTitle.textContent = song.title;
  desktopArtist.textContent = song.artist;

  addToRecent(song);
  updateLikeButtons(song);
}

playBtn.addEventListener("click", () => {
  if (!audioPlayer.src) return;

  if (audioPlayer.paused) {
    audioPlayer.play();
  } else {
    audioPlayer.pause();
  }
});

audioPlayer.addEventListener("play", () => playBtn.textContent = "❚❚");
audioPlayer.addEventListener("pause", () => playBtn.textContent = "▶");

audioPlayer.addEventListener("ended", () => {
  if (isRepeat) {
    audioPlayer.currentTime = 0;
    audioPlayer.play();
  } else {
    playNextSong();
  }
});

audioPlayer.addEventListener("timeupdate", () => {
  if (!audioPlayer.duration || Number.isNaN(audioPlayer.duration)) return;

  progressBar.value = (audioPlayer.currentTime / audioPlayer.duration) * 100;
  currentTime.textContent = formatTime(audioPlayer.currentTime);
  duration.textContent = formatTime(audioPlayer.duration);
});

progressBar.addEventListener("input", () => {
  if (!audioPlayer.duration) return;
  audioPlayer.currentTime = (Number(progressBar.value) / 100) * audioPlayer.duration;
});

volumeBar.addEventListener("input", () => {
  audioPlayer.volume = Number(volumeBar.value);
});

function formatTime(seconds) {
  if (!seconds || Number.isNaN(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

/* Controls */

function playNextSong() {
  if (queue.length === 0) return;

  currentIndex = isShuffle
    ? Math.floor(Math.random() * queue.length)
    : (currentIndex + 1) % queue.length;

  playSong(queue[currentIndex]);
}

function playPreviousSong() {
  if (queue.length === 0) return;

  currentIndex = currentIndex <= 0 ? queue.length - 1 : currentIndex - 1;
  playSong(queue[currentIndex]);
}

nextBtn.addEventListener("click", playNextSong);
prevBtn.addEventListener("click", playPreviousSong);

shuffleBtn.addEventListener("click", () => {
  isShuffle = !isShuffle;
  shuffleBtn.classList.toggle("active-control", isShuffle);
});

repeatBtn.addEventListener("click", () => {
  isRepeat = !isRepeat;
  repeatBtn.classList.toggle("active-control", isRepeat);
});

/* Likes and recent */

function toggleLike(song) {
  if (likedSongs.some((item) => item.id === song.id)) {
    likedSongs = likedSongs.filter((item) => item.id !== song.id);
  } else {
    likedSongs.unshift(song);
  }

  saveArray("raagLikedSongs", likedSongs);
  updateLikeButtons(song);
  renderLikedSongs();
}

function updateLikeButtons(song) {
  const liked = likedSongs.some((item) => item.id === song.id);
  likeBtn.textContent = liked ? "♥" : "♡";
  desktopLikeBtn.textContent = liked ? "♥" : "♡";
}

likeBtn.addEventListener("click", () => {
  if (currentSong) toggleLike(currentSong);
});

desktopLikeBtn.addEventListener("click", () => {
  if (currentSong) toggleLike(currentSong);
});

function renderLikedSongs() {
  likedSongsContainer.innerHTML = "";

  if (!likedSongs.length) {
    likedSongsContainer.innerHTML = "<p class='search-status'>No liked songs yet.</p>";
    return;
  }

  likedSongs.forEach((song) => likedSongsContainer.appendChild(createSongCard(song)));
}

function addToRecent(song) {
  recentSongs = recentSongs.filter((item) => item.id !== song.id);
  recentSongs.unshift(song);
  recentSongs = recentSongs.slice(0, 8);

  saveArray("raagRecentSongs", recentSongs);
  renderRecentSongs();
}

function renderRecentSongs() {
  recentSongsContainer.innerHTML = "";

  if (!recentSongs.length) {
    recentSongsContainer.innerHTML = "<p class='search-status'>Your recently played songs will appear here.</p>";
    return;
  }

  recentSongs.forEach((song) => recentSongsContainer.appendChild(createSongCard(song)));
}

clearRecentBtn.addEventListener("click", () => {
  recentSongs = [];
  localStorage.removeItem("raagRecentSongs");
  renderRecentSongs();
});

/* Playlist creation */

function openCreatePlaylistModal() {
  playlistModal.classList.remove("hidden");
  playlistNameInput.focus();
}

function closeCreatePlaylistModal() {
  playlistModal.classList.add("hidden");
  playlistNameInput.value = "";
}

createPlaylistBtn.addEventListener("click", openCreatePlaylistModal);
libraryCreatePlaylistBtn.addEventListener("click", openCreatePlaylistModal);
closePlaylistModal.addEventListener("click", closeCreatePlaylistModal);

playlistModal.addEventListener("click", (event) => {
  if (event.target === playlistModal) closeCreatePlaylistModal();
});

playlistForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = playlistNameInput.value.trim();
  if (!name) return;

  playlists.push({
    id: `${Date.now()}-${Math.random()}`,
    name,
    songs: []
  });

  saveArray("raagPlaylists", playlists);
  closeCreatePlaylistModal();
  renderCustomPlaylists();
  renderPlaylistGrid();
});

/* Playlist display */

function renderCustomPlaylists() {
  customPlaylists.innerHTML = "";

  playlists.forEach((playlist) => {
    const button = document.createElement("button");
    button.className = "playlist-link";
    button.textContent = `♫ ${playlist.name}`;
    button.addEventListener("click", () => openPlaylist(playlist.id));
    customPlaylists.appendChild(button);
  });
}

function renderPlaylistGrid() {
  playlistGrid.innerHTML = "";

  if (!playlists.length) {
    playlistGrid.innerHTML = "<p class='search-status'>Create a playlist and add songs to it.</p>";
    return;
  }

  playlists.forEach((playlist) => {
    const card = document.createElement("article");
    card.className = "playlist-card";

    const cover = playlist.songs[0]?.image;

    card.innerHTML = `
      <div class="playlist-cover">
        ${cover ? `<img src="${cover}" alt="${playlist.name}">` : "<span>♫</span>"}
      </div>
      <h3>${playlist.name}</h3>
      <p>${playlist.songs.length} song${playlist.songs.length === 1 ? "" : "s"}</p>
      <button class="delete-playlist-btn">Delete</button>
    `;

    card.addEventListener("click", () => openPlaylist(playlist.id));

    card.querySelector(".delete-playlist-btn").addEventListener("click", (event) => {
      event.stopPropagation();

      playlists = playlists.filter((item) => item.id !== playlist.id);
      saveArray("raagPlaylists", playlists);
      renderCustomPlaylists();
      renderPlaylistGrid();
    });

    playlistGrid.appendChild(card);
  });
}

/* Add song to playlist */

function openAddSongModal(song) {
  songToAdd = song;

  if (!playlists.length) {
    alert("Create a playlist first.");
    openCreatePlaylistModal();
    return;
  }

  addSongText.textContent = `Choose a playlist for "${song.title}".`;
  playlistChoiceList.innerHTML = "";

  playlists.forEach((playlist) => {
    const button = document.createElement("button");
    button.className = "playlist-choice-btn";
    button.innerHTML = `<strong>${playlist.name}</strong><span>${playlist.songs.length} songs</span>`;

    button.addEventListener("click", () => {
      if (!playlist.songs.some((item) => item.id === songToAdd.id)) {
        playlist.songs.push(songToAdd);
        saveArray("raagPlaylists", playlists);
        renderPlaylistGrid();
      }

      closeAddSongModal();
    });

    playlistChoiceList.appendChild(button);
  });

  addSongModal.classList.remove("hidden");
}

function closeAddSongModal() {
  addSongModal.classList.add("hidden");
  songToAdd = null;
}

closeAddSongModalBtn.addEventListener("click", closeAddSongModal);

addSongModal.addEventListener("click", (event) => {
  if (event.target === addSongModal) closeAddSongModal();
});

/* Open playlist */

function openPlaylist(playlistId) {
  const playlist = playlists.find((item) => item.id === playlistId);
  if (!playlist) return;

  changePage("library");

  queue = [...playlist.songs];
  currentIndex = -1;
  queueHeading.textContent = playlist.name;
  renderQueue();

  queueSongsContainer.scrollIntoView({ behavior: "smooth" });
}

function renderQueue() {
  queueSongsContainer.innerHTML = "";

  if (!queue.length) {
    queueSongsContainer.innerHTML = "<p class='search-status'>This playlist has no songs yet.</p>";
    return;
  }

  queue.forEach((song, index) => {
    queueSongsContainer.appendChild(createSongCard(song, index));
  });
}

/* Quick picks */

document.querySelectorAll(".mood-card").forEach((card) => {
  card.addEventListener("click", () => {
    changePage("search");
    searchInput.value = card.dataset.query;
    searchForm.dispatchEvent(new Event("submit", { cancelable: true }));
  });
});

/* Start */

renderRecentSongs();
renderLikedSongs();
renderCustomPlaylists();
renderPlaylistGrid();
renderQueue();
