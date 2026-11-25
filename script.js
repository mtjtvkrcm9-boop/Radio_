

/* =====================================

   RADIO SOMEWHERE

   RADIO + MUSIC ARCHIVE

   ===================================== */

const audio = document.getElementById("audio");

const playButton = document.getElementById("play");

const nextButton = document.getElementById("next");

const previousButton = document.getElementById("previous");

const archive = document.getElementById("archive");

const songForm = document.getElementById("song-form");

let songs = [];

let currentSongIndex = -1;

let currentAudioURL = null;

let audioContext = null;

let analyser = null;

let audioSource = null;

let frequencyData = null;

// LOAD SAVED SONGS

try {

  songs = JSON.parse(

    localStorage.getItem("radioSongs")

  ) || [];

} catch {

  songs = [];

}

// ELEMENTS

const currentTitle = document.getElementById("current-title");

const currentArtist = document.getElementById("current-artist");

const currentAlbum = document.getElementById("current-album");

const currentCover = document.getElementById("current-cover");

const detailTitle = document.getElementById("detail-title");

const songHistory = document.getElementById("song-history");

const personalNote = document.getElementById("personal-note");

const signalText = document.getElementById("signal-text");

const signalLight = document.querySelector(".signal-light");

// SAVE SONGS

function saveSongs() {

  try {

    localStorage.setItem(

      "radioSongs",

      JSON.stringify(songs)

    );

    return true;

  } catch (error) {

    alert(

      "Your browser storage is full. Try using smaller album artwork images."

    );

    return false;

  }

}

// READ IMAGE UPLOADS

function readImage(file) {

  return new Promise((resolve, reject) => {

    if (!file) {

      resolve("");

      return;

    }

    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);

    reader.onerror = reject;

    reader.readAsDataURL(file);

  });

}

// RADIO STATUS

function setStatus(message, playing = false) {

  signalText.textContent = message;

  signalLight.classList.toggle(

    "playing",

    playing

  );

}

// DISPLAY SONG

function displaySong(index) {

  if (songs.length === 0) return;

  if (index < 0 || index >= songs.length) return;

  currentSongIndex = index;

  const song = songs[index];

  currentTitle.textContent = song.title;

  currentArtist.textContent = song.artist;

  currentAlbum.textContent =

    [song.album, song.year].filter(Boolean).join(" · ") ||

    "Album information unavailable";

  currentCover.src =

    song.cover ||

    "https://placehold.co/300x300/39465c/c7d3e4?text=RADIO";

  detailTitle.textContent = song.title;

  songHistory.textContent =

    song.history || "No song history added yet.";

  personalNote.textContent =

    song.note || "No personal notes added yet.";

  // Stop the previous song.

  audio.pause();

  audio.removeAttribute("src");

  audio.load();

  if (currentAudioURL) {

    URL.revokeObjectURL(currentAudioURL);

    currentAudioURL = null;

  }

  // Load the selected audio file if available.

  if (song.audioFile) {

    currentAudioURL = URL.createObjectURL(

      song.audioFile

    );

    audio.src = currentAudioURL;

    setStatus("SIGNAL READY");

  } else {

    setStatus("NO AUDIO FILE");

  }

  playButton.textContent = "▶";

  renderArchive();

}

// RENDER ARCHIVE

function renderArchive() {

  archive.innerHTML = "";

  if (songs.length === 0) {

    archive.innerHTML =

      '<p class="empty-message">No transmissions yet. Add your first song below.</p>';

    return;

  }

  songs.forEach((song, index) => {

    const item = document.createElement("button");

    item.type = "button";

    item.className = "archive-item";

    if (index === currentSongIndex) {

      item.classList.add("selected");

    }

    const image = document.createElement("img");

    image.src =

      song.cover ||

      "https://placehold.co/100x100/39465c/c7d3e4?text=RADIO";

    image.alt = "Album artwork";

    const info = document.createElement("div");

    info.className = "archive-item-info";

    const title = document.createElement("strong");

    title.textContent = song.title;

    const artist = document.createElement("span");

    artist.textContent =

      song.artist +

      (song.album ? " · " + song.album : "");

    info.appendChild(title);

    info.appendChild(artist);

    item.appendChild(image);

    item.appendChild(info);

    item.addEventListener("click", () => {

      displaySong(index);

    });

    archive.appendChild(item);

  });

}

// ADD A NEW SONG

songForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  const title = document.getElementById("song-title").value.trim();

  const artist = document.getElementById("artist").value.trim();

  const album = document.getElementById("album").value.trim();

  const year = document.getElementById("year").value.trim();

  const history = document.getElementById("history").value.trim();

  const note = document.getElementById("note").value.trim();

  const coverFile =

    document.getElementById("cover").files[0];

  const audioFile =

    document.getElementById("audio-file").files[0];

  if (!title || !artist) {

    alert("Please enter a song title and artist.");

    return;

  }

  try {

    const cover = await readImage(coverFile);

    const newSong = {

      title: title,

      artist: artist,

      album: album,

      year: year,

      cover: cover,

      history: history,

      note: note,

      // Audio is kept in memory for this browser session.

      audioFile: audioFile || null

    };

    songs.push(newSong);

    if (!saveSongs()) {

      songs.pop();

      return;

    }

    songForm.reset();

    displaySong(songs.length - 1);

    alert("Your song has been added to the archive!");

  } catch (error) {

    alert("There was a problem uploading your artwork.");

  }

});

// PLAY / PAUSE

playButton.addEventListener("click", async () => {

  if (currentSongIndex === -1) {

    if (songs.length === 0) {

      alert("Add a song to the archive first!");

    } else {

      displaySong(0);

    }

    return;

  }

  const song = songs[currentSongIndex];

  if (!song.audioFile || !audio.src) {

    alert(

      "This song does not have an uploaded audio file yet."

    );

    return;

  }

  try {

    if (audio.paused) {

      setupVisualizer();

      if (audioContext.state === "suspended") {

        await audioContext.resume();

      }

      await audio.play();

      playButton.textContent = "Ⅱ";

      setStatus("NOW TRANSMITTING", true);

    } else {

      audio.pause();

      playButton.textContent = "▶";

      setStatus("TRANSMISSION PAUSED");

    }

  } catch (error) {

    alert("The audio could not be played.");

  }

});

// NEXT SONG

nextButton.addEventListener("click", () => {

  if (songs.length === 0) return;

  const nextIndex =

    currentSongIndex < 0

      ? 0

      : (currentSongIndex + 1) % songs.length;

  displaySong(nextIndex);

});

// PREVIOUS SONG

previousButton.addEventListener("click", () => {

  if (songs.length === 0) return;

  const previousIndex =

    currentSongIndex < 0

      ? 0

      : (currentSongIndex - 1 + songs.length) % songs.length;

  displaySong(previousIndex);

});

// AUTOMATICALLY MOVE TO NEXT SONG

audio.addEventListener("ended", () => {

  if (songs.length > 1) {

    const nextIndex =

      (currentSongIndex + 1) % songs.length;

    displaySong(nextIndex);

  } else {

    playButton.textContent = "▶";

    setStatus("TRANSMISSION ENDED");

  }

});

// VOLUME

document.getElementById("volume").addEventListener(

  "input",

  (event) => {

    audio.volume = Number(event.target.value);

  }

);

// TUNING DIAL

document.getElementById("tuner").addEventListener(

  "input",

  (event) => {

    const frequency = Number(event.target.value);

    document.getElementById("frequency").textContent =

      frequency.toFixed(1);

  }

);

// AUDIO VISUALIZER

const canvas = document.getElementById("waveCanvas");

const ctx = canvas.getContext("2d");

// Connect the audio to the visualizer once.

function setupVisualizer() {

  if (audioContext) return;

  audioContext = new (

    window.AudioContext ||

    window.webkitAudioContext

  )();

  analyser = audioContext.createAnalyser();

  analyser.fftSize = 256;

  audioSource =

    audioContext.createMediaElementSource(audio);

  audioSource.connect(analyser);

  analyser.connect(audioContext.destination);

  frequencyData = new Uint8Array(

    analyser.frequencyBinCount

  );

}

// DRAW SOUND WAVES

function drawWaves() {

  const width = canvas.clientWidth;

  const height = canvas.clientHeight;

  const dpr = window.devicePixelRatio || 1;

  if (

    canvas.width !== width * dpr ||

    canvas.height !== height * dpr

  ) {

    canvas.width = width * dpr;

    canvas.height = height * dpr;

  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.clearRect(0, 0, width, height);

  const center = height / 2;

  const playing =

    analyser && !audio.paused;

  if (playing) {

    analyser.getByteFrequencyData(frequencyData);

  }

  ctx.beginPath();

  ctx.strokeStyle = "#c7d3e4";

  ctx.lineWidth = 1.7;

  ctx.shadowBlur = 7;

  ctx.shadowColor = "#aabbd0";

  for (let x = 0; x < width; x++) {

    let y;

    if (playing) {

      const index = Math.floor(

        (x / width) * frequencyData.length

      );

      const amplitude =

        frequencyData[index] / 255;

      const wave =

        Math.sin(x * 0.09) * amplitude * 30;

      y = center + wave;

    } else {

      // Quiet animated signal while the radio is idle.

      y = center +

        Math.sin(x * 0.035 + performance.now() * 0.001) * 3 +

        Math.sin(x * 0.08 + performance.now() * 0.0007) * 2;

    }

    if (x === 0) {

      ctx.moveTo(x, y);

    } else {

      ctx.lineTo(x, y);

    }

  }

  ctx.stroke();

  requestAnimationFrame(drawWaves);

}

// START VISUALIZER

drawWaves();

// INITIALIZE VOLUME

audio.volume = 0.7;

// LOAD ARCHIVE ON STARTUP

renderArchive();

if (songs.length > 0) {

  displaySong(0);

}
