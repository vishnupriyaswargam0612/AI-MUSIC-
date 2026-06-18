const musicDB = {
    happy: "songs/happy.mp3",
    sad: "songs/sad.mp3",
    romantic: "songs/romantic.mp3",
    relaxed: "songs/relaxed.mp3",
    energetic: "songs/energetic.mp3"
};

const moodTrackTitles = {
    happy: "Sunshine Horizon",
    sad: "Melancholic Raindrops",
    romantic: "Midnight Whispers",
    relaxed: "Ethereal Breeze",
    energetic: "Neon Pulse"
};

let selectedMood = "relaxed";
let modelsLoaded = false;
let isPlaying = false;
let generatedCoverUrl = "";

// Audio & Visualizer State
let audioCtx = null;
let analyser = null;
let source = null;
let visualizerRunning = false;

// Tone.js Synth State
let synth = null;
let delay = null;
let synthSequence = null;
let synthActive = false;

// ================= INITIALIZATION & SETUP =================

window.onload = function() {
    // Populate User Details
    const email = localStorage.getItem("currentUser") || "Vibe Artist";
    document.getElementById("userDisplay").innerText = email;
    
    // Check if session exists on backend
    fetch("/api/auth/session")
        .then(res => res.json())
        .then(data => {
            if (!data.logged_in) {
                // If not logged in on backend, kick back to login page
                window.location.href = "login.html";
            } else {
                document.getElementById("userDisplay").innerText = data.email;
                localStorage.setItem("currentUser", data.email);
            }
        })
        .catch(() => {
            // Offline fallback
        });

    // Load API Key from local storage
    const storedKey = localStorage.getItem("gemini_api_key");
    if (storedKey) {
        document.getElementById("geminiKeyInput").value = storedKey;
    }

    // Load History & Gallery from SQLite backend
    loadHistory();
    loadGallery();
    
    // Set initial vibe body theme
    setVibe("relaxed");
    
    // Listen for audio player events
    setupAudioPlayerListeners();
};

function saveApiKey() {
    const key = document.getElementById("geminiKeyInput").value.trim();
    localStorage.setItem("gemini_api_key", key);
}

// ================= NAVIGATION / TABS =================

function selectMode(mode) {
    // Toggle active state on buttons
    document.querySelectorAll(".mode-btn").forEach(btn => btn.classList.remove("active"));
    document.getElementById("mode-" + mode).classList.add("active");

    // Show selected box
    document.getElementById("cameraBox").classList.add("hidden");
    document.getElementById("typeBox").classList.add("hidden");
    document.getElementById("emojiBox").classList.add("hidden");

    if (mode === "camera") {
        document.getElementById("cameraBox").classList.remove("hidden");
        startCamera();
    } else {
        stopCamera();
        if (mode === "type") {
            document.getElementById("typeBox").classList.remove("hidden");
        } else if (mode === "emoji") {
            document.getElementById("emojiBox").classList.remove("hidden");
        }
    }
}

// ================= AUTH SESSION =================

function logout() {
    fetch("/api/auth/logout", { method: "POST" })
        .then(() => {
            localStorage.removeItem("currentUser");
            window.location.href = "login.html";
        })
        .catch(() => {
            window.location.href = "login.html";
        });
}

// ================= THEME STATE CONTROLLER =================

function setVibe(mood) {
    selectedMood = mood;
    
    // Update body class for styling
    document.body.className = "theme-bg mood-" + mood;
    
    // Update active badge
    document.getElementById("mood").innerText = mood;
    
    // Highlight emoji card if in emoji view
    document.querySelectorAll(".emoji-card").forEach(c => c.classList.remove("active"));
    const activeEmojiCard = document.getElementById("emoji-" + mood);
    if (activeEmojiCard) activeEmojiCard.classList.add("active");

    // Update dropdown selector
    const drop = document.getElementById("moodSelect");
    if (drop) drop.value = mood;

    // Reset download button until next cover is composed
    document.getElementById("downloadBtn").disabled = !generatedCoverUrl;
    
    // If synth is active, shift synth key to match new vibe
    if (synthActive) {
        startSynthLoop(mood);
    }
}

// ================= WEBCAM & FACE DETECTION (REAL AI) =================

let videoStream = null;
let trackingInterval = null;

async function startCamera() {
    try {
        const video = document.getElementById("video");
        const status = document.getElementById("camStatus");
        status.style.background = "#ffcc00"; // yellow indicating load

        videoStream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 320, height: 240 } 
        });
        video.srcObject = videoStream;
        
        if (!modelsLoaded) {
            // Load Face API models from local server
            await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
            await faceapi.nets.faceExpressionNet.loadFromUri('/models');
            modelsLoaded = true;
        }
        
        status.style.background = "#1dd1a1"; // green indicating ready
        
        // Start continuous live face-tracking overlay
        startLiveFaceTracking();
    } catch (err) {
        console.error("Camera access error:", err);
        alert("Unable to access camera. Please check permissions.");
    }
}

function stopCamera() {
    stopLiveFaceTracking();
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
    const video = document.getElementById("video");
    if (video) video.srcObject = null;
}

function startLiveFaceTracking() {
    const video = document.getElementById("video");
    const canvas = document.getElementById("overlayCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    const displaySize = { width: 320, height: 240 };
    faceapi.matchDimensions(canvas, displaySize);
    
    trackingInterval = setInterval(async () => {
        if (!modelsLoaded || !videoStream) return;
        
        try {
            const detections = await faceapi.detectAllFaces(
                video, 
                new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.15 })
            ).withFaceExpressions();
            
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw tracking bounding box & expressions overlay
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
            
            if (resizedDetections.length > 0) {
                const expressions = resizedDetections[0].expressions;
                let highestExpr = "neutral";
                let highestVal = 0;
                
                for (const [expr, value] of Object.entries(expressions)) {
                    if (value > highestVal) {
                        highestVal = value;
                        highestExpr = expr;
                    }
                }
                
                // Map to app moods
                let mood = mapExpressionToMood(highestExpr);
                if (mood !== selectedMood) {
                    setVibe(mood);
                }
            }
        } catch (e) {
            console.error("Live face tracking error:", e);
        }
    }, 250);
}

function stopLiveFaceTracking() {
    if (trackingInterval) {
        clearInterval(trackingInterval);
        trackingInterval = null;
    }
    const canvas = document.getElementById("overlayCanvas");
    if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

function mapExpressionToMood(expr) {
    if (expr === "happy" || expr === "surprised") {
        return "happy";
    } else if (expr === "sad" || expr === "fearful") {
        return "sad";
    } else if (expr === "angry" || expr === "disgusted") {
        return "energetic";
    } else {
        return "relaxed";
    }
}

function detectMoodFromCamera() {
    // Instantly save the currently tracked dynamic mood
    saveHistory(selectedMood);
    generateMusic();
}

// ================= OTHER INPUT HANDLING =================

function selectEmojiMood(mood) {
    setVibe(mood);
    generateMusic();
    saveHistory(mood);
}

function selectMoodFromDropdown() {
    const val = document.getElementById("moodSelect").value;
    if (val) {
        setVibe(val);
        generateMusic();
        saveHistory(val);
    }
}

function detectMoodFromInputText() {
    const text = document.getElementById("moodInput").value.toLowerCase();
    let detected = "";
    
    if (text.includes("sad") || text.includes("cry") || text.includes("alone") || text.includes("hurt") || text.includes("depressed")) {
        detected = "sad";
    } else if (text.includes("party") || text.includes("hype") || text.includes("pumped") || text.includes("angry") || text.includes("work")) {
        detected = "energetic";
    } else if (text.includes("chill") || text.includes("sleep") || text.includes("rain") || text.includes("calm") || text.includes("peace")) {
        detected = "relaxed";
    } else if (text.includes("love") || text.includes("romantic") || text.includes("date") || text.includes("crush")) {
        detected = "romantic";
    } else if (text.includes("happy") || text.includes("excited") || text.includes("joy") || text.includes("good")) {
        detected = "happy";
    }

    if (detected && detected !== selectedMood) {
        setVibe(detected);
    }
}

// ================= CUSTOM AUDIO PLAYER & VISUALIZER =================

function setupAudioPlayerListeners() {
    const audio = document.getElementById("audioPlayer");
    const playBtn = document.getElementById("playBtn");
    const progressBar = document.getElementById("progressBar");
    const currentTimeText = document.getElementById("currentTime");
    const durationText = document.getElementById("duration");

    audio.onplay = () => {
        isPlaying = true;
        playBtn.innerText = "⏸";
        // Connect and kickstart audio visualizer
        setupVisualizer();
        if (synthActive) {
            Tone.start();
            Tone.Transport.start();
        }
    };

    audio.onpause = () => {
        isPlaying = false;
        playBtn.innerText = "▶";
    };

    audio.onended = () => {
        isPlaying = false;
        playBtn.innerText = "▶";
    };

    // Update Progress bar
    audio.ontimeupdate = () => {
        if (audio.duration) {
            const pct = (audio.currentTime / audio.duration) * 100;
            progressBar.value = pct;
            
            currentTimeText.innerText = formatTime(audio.currentTime);
            durationText.innerText = formatTime(audio.duration);
        }
    };
}

function togglePlay() {
    const audio = document.getElementById("audioPlayer");
    if (!audio.src) {
        generateMusic();
        return;
    }
    
    // Resume Audio Context on click (browser policy bypass)
    if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume();
    }
    
    if (isPlaying) {
        audio.pause();
    } else {
        audio.play().catch(e => console.error("Audio playback error:", e));
    }
}

function seekAudio() {
    const audio = document.getElementById("audioPlayer");
    const progressBar = document.getElementById("progressBar");
    if (audio.duration) {
        audio.currentTime = (progressBar.value / 100) * audio.duration;
    }
}

function changeVolume() {
    const audio = document.getElementById("audioPlayer");
    const slider = document.getElementById("volumeSlider");
    audio.volume = slider.value / 100;
}

function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// ================= WEBAUDIO ANALYSER VISUALIZER =================

function setupVisualizer() {
    const audio = document.getElementById("audioPlayer");
    const canvas = document.getElementById("visualizerCanvas");
    const ctx = canvas.getContext("2d");
    
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
    }
    
    analyser.fftSize = 64;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    function draw() {
        if (!isPlaying) {
            visualizerRunning = false;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        
        requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = (canvas.width / bufferLength) * 1.6;
        let barHeight;
        let x = 0;
        
        const activeColor = getComputedStyle(document.body).getPropertyValue('--accent-primary').trim() || '#ff4da6';
        
        for (let i = 0; i < bufferLength; i++) {
            barHeight = (dataArray[i] / 255) * canvas.height * 1.1;
            
            ctx.fillStyle = activeColor;
            ctx.shadowBlur = 8;
            ctx.shadowColor = activeColor;
            
            // Draw visual spectrum bars
            ctx.fillRect(x, canvas.height - barHeight, barWidth - 3, barHeight);
            
            x += barWidth;
        }
    }
    
    if (!visualizerRunning) {
        visualizerRunning = true;
        draw();
    }
}

// ================= GENERATING MUSIC & ALBUM ART =================

function generateMusic() {
    const audio = document.getElementById("audioPlayer");
    const songUrl = musicDB[selectedMood];
    
    // Only reload track if it's changing
    if (audio.src.indexOf(songUrl) === -1) {
        audio.src = songUrl;
        audio.load();
    }
    
    if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume();
    }
    
    audio.play().catch(e => console.error("Play error:", e));
}

// Composes custom album artwork based on scenario and active vibe
function generateFromScenario() {
    const scenario = document.getElementById("scenarioInput").value.trim() || "Vibe Symphony";
    const coverContainer = document.getElementById("coverContainer");
    const downloadBtn = document.getElementById("downloadBtn");
    
    coverContainer.classList.add("loading");
    downloadBtn.disabled = true;
    
    const songTitle = moodTrackTitles[selectedMood] || "My Vibe Rhythm";
    const apiKey = localStorage.getItem("gemini_api_key") || "";

    fetch("/api/generate_cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            mood: selectedMood,
            song_title: scenario,
            api_key: apiKey
        })
    })
    .then(res => res.json())
    .then(data => {
        coverContainer.classList.remove("loading");
        
        if (data.cover_url) {
            generatedCoverUrl = data.cover_url;
            document.getElementById("albumCoverImg").src = data.cover_url;
            downloadBtn.disabled = false;
            
            // Refresh Art Gallery grid
            loadGallery();
        }
    })
    .catch(err => {
        coverContainer.classList.remove("loading");
        console.error("Cover Art composition error:", err);
    });
}

function downloadAlbumCover() {
    if (!generatedCoverUrl) return;
    
    const link = document.createElement("a");
    link.href = generatedCoverUrl;
    link.download = `art_cover_${selectedMood}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ================= TONE.JS AMBIENT SYNTHESIS =================

function toggleToneSynth() {
    if (typeof Tone === "undefined") {
        alert("Tone.js Library is not ready.");
        return;
    }
    
    const btn = document.getElementById("synthBtn");
    const status = document.getElementById("synthStatus");
    
    if (synthActive) {
        synthActive = false;
        Tone.Transport.stop();
        if (synthSequence) {
            synthSequence.stop();
            synthSequence.dispose();
            synthSequence = null;
        }
        btn.innerText = "Activate Synth";
        status.innerText = "INACTIVE";
        status.style.color = "var(--color-energetic)";
    } else {
        synthActive = true;
        btn.innerText = "Deactivate Synth";
        status.innerText = "ACTIVE";
        status.style.color = "var(--color-relaxed)";
        
        // Start Audio Context & Synth engine
        Tone.start().then(() => {
            initSynth();
            startSynthLoop(selectedMood);
            Tone.Transport.start();
        });
    }
}

function initSynth() {
    if (synth) return;
    
    // Setup a rich delay feedback unit
    delay = new Tone.FeedbackDelay("8n.", 0.65).toDestination();
    
    // Polysynth configured with smooth attack
    synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: {
            attack: 0.9,
            decay: 0.4,
            sustain: 0.75,
            release: 1.6
        }
    }).connect(delay);
    
    synth.volume.value = -16; // Low background pad volume
}

function startSynthLoop(mood) {
    if (!synth) return;
    if (synthSequence) {
        synthSequence.dispose();
    }
    
    // Music progressions optimized per mood
    const progressions = {
        happy: [
            ["C4", "E4", "G4", "B4"], 
            ["F4", "A4", "C5", "E5"], 
            ["G4", "B4", "D5", "F5"], 
            ["F4", "A4", "C5", "E5"]
        ],
        sad: [
            ["A3", "C4", "E4", "G4"], 
            ["D3", "F4", "A4", "C5"], 
            ["F3", "A3", "C4", "E4"], 
            ["E3", "G3", "B3", "D4"]
        ],
        romantic: [
            ["C4", "E4", "G4", "B4"], 
            ["A3", "C4", "E4", "G4"], 
            ["D3", "F4", "A4", "C5"], 
            ["G3", "B3", "D4", "F#4"]
        ],
        relaxed: [
            ["D4", "F4", "A4", "C5"], 
            ["G3", "B3", "D4", "F4"], 
            ["C4", "E4", "G4", "B4"], 
            ["F3", "A3", "C4", "E4"]
        ],
        energetic: [
            ["E4", "G4", "B4", "D5"], 
            ["C4", "E4", "G4", "B4"], 
            ["D4", "F#4", "A4", "C#5"], 
            ["B3", "D#4", "F#4", "A4"]
        ]
    };
    
    const chords = progressions[mood] || progressions.relaxed;
    
    // Sequence pattern loop
    synthSequence = new Tone.Pattern((time, chord) => {
        synth.triggerAttackRelease(chord, "1m", time);
    }, chords, "upDown");
    
    synthSequence.interval = "1m";
    synthSequence.start(0);
}

// ================= BACKEND REST API HELPERS =================

function loadHistory() {
    fetch("/api/history")
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById("historyList");
            list.innerHTML = "";
            
            if (!data.history || data.history.length === 0) {
                list.innerHTML = `<div style="color:var(--text-secondary); text-align:center; font-size:12px; background:none; border:none;">No recent vibes</div>`;
                return;
            }
            
            data.history.forEach(item => {
                const row = document.createElement("div");
                
                // Format timestamp
                const d = new Date(item.timestamp);
                const timeStr = `${d.getHours()}:${d.getMinutes() < 10 ? '0' : ''}${d.getMinutes()}`;
                
                row.innerHTML = `
                    <span class="history-mood-badge ${item.mood}">${item.mood}</span>
                    <span class="history-time">${timeStr}</span>
                `;
                list.appendChild(row);
            });
        })
        .catch(err => console.error("Error loading history:", err));
}

function saveHistory(mood) {
    fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: mood })
    })
    .then(() => {
        loadHistory();
    })
    .catch(err => console.error("Error saving history:", err));
}

function loadGallery() {
    fetch("/api/covers")
        .then(res => res.json())
        .then(data => {
            const grid = document.getElementById("coversList");
            grid.innerHTML = "";
            
            if (!data.covers || data.covers.length === 0) {
                grid.innerHTML = `<div style="grid-column: span 2; color:var(--text-secondary); text-align:center; font-size:12px; padding: 10px 0;">No compositions yet</div>`;
                return;
            }
            
            data.covers.forEach(item => {
                const card = document.createElement("div");
                card.className = "gallery-item";
                card.title = `Mood: ${item.mood}`;
                card.onclick = () => {
                    // Load this past cover into studio view
                    generatedCoverUrl = item.cover_path;
                    document.getElementById("albumCoverImg").src = item.cover_path;
                    setVibe(item.mood);
                };
                
                card.innerHTML = `<img src="${item.cover_path}" alt="Saved Cover">`;
                grid.appendChild(card);
            });
        })
        .catch(err => console.error("Error loading gallery:", err));
}

// Check if running directly from file system
document.addEventListener("DOMContentLoaded", () => {
    if (window.location.protocol === 'file:') {
        const banner = document.createElement("div");
        banner.style.position = "fixed";
        banner.style.top = "0";
        banner.style.left = "0";
        banner.style.width = "100%";
        banner.style.background = "#ff2d55";
        banner.style.color = "white";
        banner.style.textAlign = "center";
        banner.style.padding = "12px";
        banner.style.zIndex = "999999";
        banner.style.fontWeight = "700";
        banner.style.fontSize = "14px";
        banner.style.boxShadow = "0 4px 15px rgba(0,0,0,0.3)";
        banner.innerHTML = '⚠️ Running from local files. To connect to the backend, please open: <a href="http://127.0.0.1:5000/" style="color:white; text-decoration:underline; font-weight:900;" target="_blank">http://127.0.0.1:5000/</a>';
        document.body.prepend(banner);
        
        // Push dashboard down slightly to not overlap banner
        const dashboard = document.querySelector(".dashboard");
        if (dashboard) dashboard.style.paddingTop = "120px";
    }
});