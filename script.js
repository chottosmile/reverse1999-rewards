// === DOM Elements ===
const bgm = document.getElementById('bgm');
const videoScreen = document.getElementById('video-screen');
const rewardVideo = document.getElementById('reward-video');
const skipBtn = document.getElementById('skip-btn');
const summonCountText = document.getElementById('summon-count');
const resetBtn = document.getElementById('reset-btn');
const overlay = document.getElementById('records-overlay');
const recordBtn = document.getElementById('record-btn');
const pullBtn1 = document.getElementById('pull-btn-1');
const pullBtn2 = document.getElementById('pull-btn-2');
const recordsPerPage = 10;

document.addEventListener('contextmenu', e => e.preventDefault()); // disable right click
document.querySelectorAll('img').forEach(img => {
  img.addEventListener('dragstart', e => e.preventDefault());
});

document.addEventListener('click', () => {
  bgm.play().catch(e => console.warn('BGM play blocked:', e));
}, { once: true });

// === Global Data ===
let summonLog = [];
let summonCount = 0;
let pity = 0;
let currentPage = 1;
let videoPlaying = false;
let videoStage = 0;
let currentStar = null;
let allowClick = false;

// === Gacha Logic ===
function getRarity() {
  pity++;

  // 🎯 Guaranteed at 70
  if (pity >= 70) {
    pity = 0;
    return '6';
  }

  // Base 6★ chance
  let sixStarRate = 0.015;

  // 🎯 After 60 pulls, start increasing rate
  if (pity > 60) {
    sixStarRate = 0.04 + 0.025 * (pity - 61);
  }

  const rand = Math.random();

  if (rand < sixStarRate) {
    pity = 0;
    return '6';
  } else if (rand < sixStarRate + 0.085) {
    return '5';
  } else if (rand < sixStarRate + 0.085 + 0.40) {
    return '4';
  } else if (rand < sixStarRate + 0.085 + 0.40 + 0.45) {
    return '3';
  } else {
    return '2';
  }
}

// === Video Logic ===
function playVideo(star) {
  videoStage = 1;
  currentStar = star;

  rewardVideo.src = `assets/${star} star A.mp4`; // part A
  videoScreen.style.display = 'flex';
  rewardVideo.play();
  videoPlaying = true;

  skipBtn.style.opacity = 0;
  setTimeout(() => {
    skipBtn.style.display = 'block';
    skipBtn.style.opacity = 1;
  }, 0);
}

// === Summon Action ===
function summon() {
  const star = getRarity();
  summonCount++;
  summonCountText.textContent = summonCount;
  logSummon(star);
  currentPage = 1;
  hideRecordModal(); // hide modal if open
  playVideo(star);
}

// === Record Handling ===
function logSummon(star) {
  const now = new Date();
  const timeOnly = now.toLocaleTimeString();
  summonLog.push({ star, time: timeOnly });
}

// === Modal Show/Hide ===
function showRecordModal() {
  updateRecordsView();
  overlay.style.visibility = 'visible';
  overlay.style.pointerEvents = 'auto';
}

function hideRecordModal() {
  overlay.style.visibility = 'hidden';
  overlay.style.pointerEvents = 'none';
}

// === Video Close / Skip Logic ===
rewardVideo.addEventListener('click', () => {
  if (videoPlaying && videoStage !== 2) return;

  if (videoStage === 2) {
    videoStage = 0;
    videoPlaying = false;
    rewardVideo.pause();
    rewardVideo.currentTime = 0;
    videoScreen.style.display = 'none';
    skipBtn.style.opacity = 0;
  }
});

skipBtn.addEventListener('click', () => {
  if (videoStage === 1) {
    videoStage = 2;
    rewardVideo.src = `assets/${currentStar} star B.mp4`; // part B
    rewardVideo.play();
    skipBtn.style.opacity = 0;
    setTimeout(() => {
      skipBtn.style.opacity = 1;
    }, 0);
  } else if (videoStage === 2) {
    videoStage = 0;
    videoPlaying = false;
    rewardVideo.pause();
    rewardVideo.currentTime = 0;
    videoScreen.style.display = 'none';
    skipBtn.style.opacity = 0;
  }
});


// === Reset Button Logic ===
resetBtn.addEventListener('click', () => {
  pity = 0;
  summonCount = 0;
  summonLog = [];
  summonCountText.textContent = summonCount;
  hideRecordModal();
});

// === Record Button Click ===
recordBtn.addEventListener('click', () => {
  if (summonLog.length === 0) return;
  currentPage = 1;
  showRecordModal();
});

// === Overlay Click to Close Modal ===
overlay.addEventListener('click', (e) => {
  const modal = document.getElementById('records-modal');
  if (!modal.contains(e.target)) {
    hideRecordModal();
  }
});

// === Summon Buttons ===
pullBtn1.addEventListener('click', summon);
pullBtn2.addEventListener('click', summon);

document.getElementById('pull-btn-10').addEventListener('click', () => {
  let maxStar = '0';
  for (let i = 0; i < 10; i++) {
    const star = getRarity();
    if (+star > +maxStar) maxStar = star;
    summonCount++;
    logSummon(star);
  }
  summonCountText.textContent = summonCount;
  currentPage = 1;
  hideRecordModal();
  playVideo(maxStar);
});

// === Record Pagination ===
function updateRecordsView() {
  const tbody = document.querySelector('#records-table tbody');
  const totalPages = Math.ceil(summonLog.length / recordsPerPage);
  currentPage = Math.min(currentPage, totalPages || 1);

  const start = (currentPage - 1) * recordsPerPage;
  const end = start + recordsPerPage;
  const reversedLog = [...summonLog].reverse(); // newest first
  const currentRecords = reversedLog.slice(start, end);


let rows = currentRecords.map(entry =>
  `<tr class="${entry.star === '6' ? 'star6' : entry.star === '5' ? 'star5' : ''}">
     <td>${entry.star}★</td><td>${entry.time}</td>
   </tr>`
);

// Fill the rest with empty rows
while (rows.length < 10) {
  rows.push(`<tr><td>&nbsp;</td><td>&nbsp;</td></tr>`);
}

tbody.innerHTML = rows.join('');

  document.getElementById('page-indicator').textContent = `${currentPage}/${totalPages || 1}`;
}

document.getElementById('prev-page').addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    updateRecordsView();
  }
});

document.getElementById('next-page').addEventListener('click', () => {
  const totalPages = Math.ceil(summonLog.length / recordsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    updateRecordsView();
  }
});
