// Mode & DOM Selectors
let currentMode = "encrypt"; // "encrypt" or "decrypt"

const modeEncryptBtn = document.getElementById("modeEncryptBtn");
const modeDecryptBtn = document.getElementById("modeDecryptBtn");
const cardLabel = document.getElementById("cardLabel");
const cardHeading = document.getElementById("cardHeading");
const passwordLabel = document.getElementById("passwordLabel");
const strengthContainer = document.getElementById("strengthContainer");
const actionBtn = document.getElementById("actionBtn");
const actionBtnText = document.getElementById("actionBtnText");
const actionLoader = document.getElementById("actionLoader");
const footerLockIcon = document.getElementById("footerLockIcon");
const footerCipherNote = document.getElementById("footerCipherNote");
const floatingNoteTwoNum = document.getElementById("floatingNoteTwoNum");
const floatingNoteTwoText = document.getElementById("floatingNoteTwoText");

const dropBox = document.getElementById("dropBox");
const fileInput = document.getElementById("fileInput");
const fileInfo = document.getElementById("fileInfo");
const passwordInput = document.getElementById("passwordInput");
const togglePassword = document.getElementById("togglePassword");
const strengthBar = document.getElementById("strengthBar");
const strengthText = document.getElementById("strengthText");
const status = document.getElementById("status");

const downloadArea = document.getElementById("downloadArea");
const downloadLink = document.getElementById("downloadLink");
const downloadTitle = document.getElementById("downloadTitle");
const downloadSubtitle = document.getElementById("downloadSubtitle");
const downloadSuccessIcon = document.getElementById("downloadSuccessIcon");

const startTransferBtn = document.getElementById("startTransferBtn");
const watchHowToBtn = document.getElementById("watchHowToBtn");
const loginBtn = document.getElementById("loginBtn");

const uploadTitle = document.getElementById("uploadTitle");
const uploadDescription = document.getElementById("uploadDescription");
const uploadIcon = document.getElementById("uploadIcon");
const toastContainer = document.getElementById("toastContainer");

// Modal Elements
const portalModal = document.getElementById("portalModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const portalConnectBtn = document.getElementById("portalConnectBtn");

let selectedFile = null;
let downloadURL = null;

/* ===================================================
   TOAST HELPER
=================================================== */
function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<span>🔒</span> <span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(6px)";
        toast.style.transition = "all 0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, 2800);
}

/* ===================================================
   PASSWORD FIELD RESET UTILITY
=================================================== */
function resetPasswordField() {
    passwordInput.value = "";
    passwordInput.type = "password";
    togglePassword.textContent = "Show";
    strengthBar.style.width = "0%";
    strengthText.textContent = "Strength: none";
    strengthText.style.color = "#666";
}

/* ===================================================
   MODE SWITCH (ENCRYPT vs DECRYPT)
=================================================== */
function setMode(mode) {
    currentMode = mode;
    downloadArea.classList.remove("visible");
    status.textContent = "";

    // Clear password whenever user switches between tabs
    resetPasswordField();

    if (mode === "encrypt") {
        modeEncryptBtn.classList.add("active");
        modeDecryptBtn.classList.remove("active");
        cardLabel.textContent = "SECURE FILE ENCRYPTION";
        cardHeading.textContent = "Encrypt a file";
        passwordLabel.textContent = "Encryption password";
        strengthContainer.style.display = "block";
        strengthText.style.display = "inline";
        actionBtnText.textContent = "Encrypt File";
        footerLockIcon.textContent = "🔒";
        footerCipherNote.textContent = "AES-256-GCM cipher";
        floatingNoteTwoText.textContent = "Encrypt locally";
        uploadDescription.textContent = "Drop any document or image";
    } else {
        modeDecryptBtn.classList.add("active");
        modeEncryptBtn.classList.remove("active");
        cardLabel.textContent = "SECURE FILE DECRYPTION";
        cardHeading.textContent = "Decrypt a file";
        passwordLabel.textContent = "Decryption password";
        strengthContainer.style.display = "none";
        strengthText.style.display = "none";
        actionBtnText.textContent = "Decrypt File";
        footerLockIcon.textContent = "🔓";
        footerCipherNote.textContent = "Zero-knowledge unpack";
        floatingNoteTwoText.textContent = "Decrypt locally";
        uploadDescription.textContent = "Drop your .encrypted file here";
    }

    if (selectedFile) {
        uploadTitle.textContent = "File selected";
    } else {
        uploadTitle.textContent = "Drop your file here";
    }
}

modeEncryptBtn.addEventListener("click", () => setMode("encrypt"));
modeDecryptBtn.addEventListener("click", () => setMode("decrypt"));

/* ===================================================
   FILE SELECTION
=================================================== */
function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const units = ["Bytes", "KB", "MB", "GB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    const safeIndex = Math.min(index, units.length - 1);
    const size = bytes / Math.pow(1024, safeIndex);
    return (size.toFixed(size >= 10 ? 0 : 1) + " " + units[safeIndex]);
}

function selectFile(file) {
    if (!file) return;
    selectedFile = file;
    fileInfo.textContent = `${file.name} • ${formatFileSize(file.size)}`;
    fileInfo.classList.add("visible");
    uploadTitle.textContent = "File selected";
    uploadDescription.textContent = `Ready for ${currentMode}`;
    if (uploadIcon) uploadIcon.textContent = "✓";
    status.textContent = `File loaded for ${currentMode}.`;
    status.className = "status";
    downloadArea.classList.remove("visible");
    showToast(`Loaded: ${file.name}`);
}

dropBox.addEventListener("click", (e) => {
    if (e.target.closest("button, input, a")) return;
    fileInput.click();
});
fileInput.addEventListener("change", () => selectFile(fileInput.files[0]));
dropBox.addEventListener("dragover", (e) => { e.preventDefault(); dropBox.classList.add("dragging"); });
dropBox.addEventListener("dragleave", () => dropBox.classList.remove("dragging"));
dropBox.addEventListener("drop", (e) => {
    e.preventDefault();
    dropBox.classList.remove("dragging");
    if (e.dataTransfer.files.length) selectFile(e.dataTransfer.files[0]);
});

togglePassword.addEventListener("click", () => {
    const isPass = passwordInput.type === "password";
    passwordInput.type = isPass ? "text" : "password";
    togglePassword.textContent = isPass ? "Hide" : "Show";
});

// Interactive UI password strength meter
passwordInput.addEventListener("input", () => {
    if (currentMode === "decrypt") return;
    const val = passwordInput.value;
    let score = 0;
    if (val.length > 5) score++;
    if (val.length > 9) score++;
    if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    if (val.length === 0) {
        strengthBar.style.width = "0%";
        strengthText.textContent = "Strength: none";
        strengthText.style.color = "#666";
    } else if (score <= 1) {
        strengthBar.style.width = "25%";
        strengthBar.style.backgroundColor = "#d87575";
        strengthText.textContent = "Strength: Weak";
        strengthText.style.color = "#d87575";
    } else if (score === 2 || score === 3) {
        strengthBar.style.width = "65%";
        strengthBar.style.backgroundColor = "#ffbd2e";
        strengthText.textContent = "Strength: Medium";
        strengthText.style.color = "#ffbd2e";
    } else {
        strengthBar.style.width = "100%";
        strengthBar.style.backgroundColor = "#78b984";
        strengthText.textContent = "Strength: Strong";
        strengthText.style.color = "#78b984";
    }
});

/* =========================================================================
   CINEMATIC FIERY HERO PORTAL (TRIGGERS AUTOMATICALLY ON ACTION)
========================================================================= */
const heroPortalOverlay = document.getElementById("heroPortalOverlay");
const heroPortalCanvas = document.getElementById("heroPortalCanvas");
const heroPortalCtx = heroPortalCanvas.getContext("2d");
const heroPortalStatus = document.getElementById("heroPortalStatus");
const skipPortalBtn = document.getElementById("skipPortalBtn");

let portalAnimationId = null;
let portalStartTime = 0;
const PORTAL_DURATION = 4.8;

function resizeHeroPortal() {
    heroPortalCanvas.width = window.innerWidth;
    heroPortalCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeHeroPortal);
resizeHeroPortal();

const sparks = [];
function createSparks(cx, cy, count, speedMult = 1, colorA = "#ffaa00", colorB = "#ff4400") {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (2 + Math.random() * 8) * speedMult;
        sparks.push({
            x: cx + Math.cos(angle) * (20 + Math.random() * 80),
            y: cy + Math.sin(angle) * (20 + Math.random() * 80),
            vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 2,
            vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 2,
            life: 1.0,
            decay: 0.015 + Math.random() * 0.03,
            size: 1.5 + Math.random() * 2.5,
            color: Math.random() > 0.3 ? colorA : colorB
        });
    }
}

function renderHeroPortalFrame(timestamp) {
    if (!portalStartTime) portalStartTime = timestamp;
    const elapsed = (timestamp - portalStartTime) / 1000;
    const progress = Math.min(elapsed / PORTAL_DURATION, 1.0);

    const W = heroPortalCanvas.width;
    const H = heroPortalCanvas.height;
    const cx = W / 2;
    const cy = H / 2;

    heroPortalCtx.clearRect(0, 0, W, H);

    const isDecrypt = currentMode === "decrypt";
    const primaryColor = isDecrypt ? "#38bdf8" : "#ffaa00";
    const secondaryColor = isDecrypt ? "#0284c7" : "#ff4400";

    let radius = 0;
    let coreDarkness = 0;

    if (progress < 0.25) {
        const t = progress / 0.25;
        radius = 160 * Math.sin((t * Math.PI) / 2);
        coreDarkness = t;
        heroPortalStatus.textContent = isDecrypt ? "SYNCHRONIZING DECRYPTION KEY..." : "OPENING QUANTUM TUNNEL...";
        createSparks(cx, cy, 5, 1.2, primaryColor, secondaryColor);
    } else if (progress < 0.75) {
        radius = 160 + Math.sin(elapsed * 10) * 6;
        coreDarkness = 1;
        heroPortalStatus.textContent = isDecrypt ? "UNPACKING AES-256 CIPHERTEXT..." : "ENCRYPTING DATA BLOCKS (AES-256)...";
        createSparks(cx, cy, 3, 0.8, primaryColor, secondaryColor);
    } else {
        const t = (progress - 0.75) / 0.25;
        radius = Math.max(0, 160 * (1 - t));
        coreDarkness = 1 - t;
        heroPortalStatus.textContent = isDecrypt ? "RESTORING ORIGINAL DOCUMENT..." : "SEALING ENCRYPTED CONTAINER...";
        createSparks(cx, cy, 6, 1.8, primaryColor, secondaryColor);
    }

    if (radius > 1) {
        const glowGrad = heroPortalCtx.createRadialGradient(cx, cy, radius * 0.4, cx, cy, radius * 1.5);
        if (isDecrypt) {
            glowGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
            glowGrad.addColorStop(0.7, "rgba(56, 189, 248, 0.4)");
            glowGrad.addColorStop(0.9, "rgba(2, 132, 199, 0.2)");
        } else {
            glowGrad.addColorStop(0, "rgba(255, 120, 0, 0)");
            glowGrad.addColorStop(0.7, "rgba(255, 140, 0, 0.5)");
            glowGrad.addColorStop(0.9, "rgba(255, 60, 0, 0.3)");
        }
        glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

        heroPortalCtx.fillStyle = glowGrad;
        heroPortalCtx.beginPath();
        heroPortalCtx.arc(cx, cy, radius * 1.5, 0, Math.PI * 2);
        heroPortalCtx.fill();

        heroPortalCtx.fillStyle = `rgba(5, 3, 2, ${0.9 * coreDarkness})`;
        heroPortalCtx.beginPath();
        heroPortalCtx.arc(cx, cy, radius * 0.85, 0, Math.PI * 2);
        heroPortalCtx.fill();

        heroPortalCtx.save();
        heroPortalCtx.translate(cx, cy);
        for (let i = 0; i < 4; i++) {
            heroPortalCtx.rotate(elapsed * 2.5 + (i * Math.PI) / 2);
            heroPortalCtx.strokeStyle = i % 2 === 0 ? primaryColor : secondaryColor;
            heroPortalCtx.lineWidth = 3 + Math.sin(elapsed * 8 + i) * 1.5;
            heroPortalCtx.beginPath();
            heroPortalCtx.arc(0, 0, radius * (0.8 + i * 0.05), 0, Math.PI * 1.6);
            heroPortalCtx.stroke();
        }
        heroPortalCtx.restore();

        if (progress > 0.2 && progress < 0.85) {
            const docScale = progress < 0.35 ? (progress - 0.2) / 0.15 : 1.0;
            drawFloatingPortalDoc(cx, cy, docScale, elapsed, isDecrypt);
        }
    }

    for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life -= s.decay;

        if (s.life <= 0) {
            sparks.splice(i, 1);
            continue;
        }

        heroPortalCtx.fillStyle = s.color;
        heroPortalCtx.shadowColor = s.color;
        heroPortalCtx.shadowBlur = 8;
        heroPortalCtx.beginPath();
        heroPortalCtx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
        heroPortalCtx.fill();
        heroPortalCtx.shadowBlur = 0;
    }

    if (progress < 1.0) {
        portalAnimationId = requestAnimationFrame(renderHeroPortalFrame);
    } else {
        closeHeroPortal(true);
    }
}

function drawFloatingPortalDoc(x, y, scale, time, isDecrypt) {
    heroPortalCtx.save();
    heroPortalCtx.translate(x, y + Math.sin(time * 6) * 6);
    heroPortalCtx.scale(scale, scale);

    heroPortalCtx.fillStyle = "#121216";
    heroPortalCtx.strokeStyle = isDecrypt ? "rgba(56, 189, 248, 0.8)" : "rgba(255, 170, 0, 0.8)";
    heroPortalCtx.lineWidth = 2.5;
    heroPortalCtx.shadowColor = isDecrypt ? "#38bdf8" : "#ff8800";
    heroPortalCtx.shadowBlur = 20;

    heroPortalCtx.beginPath();
    heroPortalCtx.roundRect(-35, -50, 70, 100, 6);
    heroPortalCtx.fill();
    heroPortalCtx.stroke();
    heroPortalCtx.shadowBlur = 0;

    heroPortalCtx.fillStyle = isDecrypt ? "rgba(56, 189, 248, 0.6)" : "rgba(255, 200, 100, 0.6)";
    heroPortalCtx.fillRect(-22, -30, 44, 4);
    heroPortalCtx.fillRect(-22, -18, 44, 4);
    heroPortalCtx.fillRect(-22, -6, 30, 4);
    heroPortalCtx.fillRect(-22, 6, 36, 4);

    heroPortalCtx.fillStyle = isDecrypt ? "#38bdf8" : "#ffaa00";
    heroPortalCtx.font = "bold 18px sans-serif";
    heroPortalCtx.textAlign = "center";
    heroPortalCtx.fillText(isDecrypt ? "🔓" : "🔒", 0, 32);

    heroPortalCtx.restore();
}

function startHeroPortal(onComplete) {
    resizeHeroPortal();
    heroPortalOverlay.classList.add("active");
    portalStartTime = 0;
    sparks.length = 0;
    portalAnimationId = requestAnimationFrame(renderHeroPortalFrame);
    window._onPortalFinish = onComplete;
}

function closeHeroPortal(triggerCallback = true) {
    if (portalAnimationId) cancelAnimationFrame(portalAnimationId);
    heroPortalOverlay.classList.remove("active");

    if (triggerCallback && window._onPortalFinish) {
        window._onPortalFinish();
        window._onPortalFinish = null;
    }
}

skipPortalBtn.addEventListener("click", () => closeHeroPortal(true));

/* =========================================================================
   ACTION BUTTON: REAL WEBCRYPTO ENCRYPT OR DECRYPT
========================================================================= */
actionBtn.addEventListener("click", async (e) => {
    e.stopPropagation();

    if (!selectedFile) {
        status.textContent = "Please select a file first.";
        status.className = "status error";
        return;
    }
    const password = passwordInput.value.trim();
    if (!password) {
        status.textContent = `Please enter the ${currentMode === "encrypt" ? "encryption" : "decryption"} password.`;
        status.className = "status error";
        passwordInput.focus();
        return;
    }

    actionBtn.disabled = true;
    actionBtn.classList.add("encrypting");
    actionBtnText.textContent = currentMode === "encrypt" ? "Encrypting..." : "Decrypting...";
    status.textContent = "Connecting to zero-knowledge browser portal...";
    status.className = "status";

    startHeroPortal(async () => {
        try {
            if (currentMode === "encrypt") {
                // ==================== ENCRYPTION ====================
                const fileData = await selectedFile.arrayBuffer();
                const salt = crypto.getRandomValues(new Uint8Array(16));
                const iv = crypto.getRandomValues(new Uint8Array(12));

                const passwordKey = await crypto.subtle.importKey(
                    "raw",
                    new TextEncoder().encode(password),
                    "PBKDF2",
                    false,
                    ["deriveKey"]
                );

                const encryptionKey = await crypto.subtle.deriveKey(
                    { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
                    passwordKey,
                    { name: "AES-GCM", length: 256 },
                    false,
                    ["encrypt"]
                );

                const encryptedData = await crypto.subtle.encrypt(
                    { name: "AES-GCM", iv: iv },
                    encryptionKey,
                    fileData
                );

                const combinedData = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
                combinedData.set(salt, 0);
                combinedData.set(iv, salt.length);
                combinedData.set(new Uint8Array(encryptedData), salt.length + iv.length);

                const encryptedBlob = new Blob([combinedData], { type: "application/octet-stream" });
                if (downloadURL) URL.revokeObjectURL(downloadURL);
                downloadURL = URL.createObjectURL(encryptedBlob);

                downloadLink.href = downloadURL;
                downloadLink.download = selectedFile.name + ".encrypted";

                downloadTitle.textContent = "Encryption complete";
                downloadSubtitle.textContent = "Your encrypted payload is ready for safe transmission.";
                downloadSuccessIcon.textContent = "✓";
                status.textContent = "File encrypted successfully.";
                status.className = "status success";
                downloadArea.classList.add("visible");
                showToast("AES-256 File Sealed & Ready!");

                // Clear the password field after successful encryption
                resetPasswordField();

            } else {
                // ==================== DECRYPTION ====================
                const fileData = await selectedFile.arrayBuffer();
                const rawBytes = new Uint8Array(fileData);

                if (rawBytes.length < 28) {
                    throw new Error("File is too small to be a valid encrypted payload.");
                }

                const salt = rawBytes.slice(0, 16);
                const iv = rawBytes.slice(16, 28);
                const ciphertext = rawBytes.slice(28);

                const passwordKey = await crypto.subtle.importKey(
                    "raw",
                    new TextEncoder().encode(password),
                    "PBKDF2",
                    false,
                    ["deriveKey"]
                );

                const decryptionKey = await crypto.subtle.deriveKey(
                    { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
                    passwordKey,
                    { name: "AES-GCM", length: 256 },
                    false,
                    ["decrypt"]
                );

                const decryptedData = await crypto.subtle.decrypt(
                    { name: "AES-GCM", iv: iv },
                    decryptionKey,
                    ciphertext
                );

                const decryptedBlob = new Blob([decryptedData], { type: "application/octet-stream" });
                if (downloadURL) URL.revokeObjectURL(downloadURL);
                downloadURL = URL.createObjectURL(decryptedBlob);

                let cleanName = selectedFile.name;
                if (cleanName.endsWith(".encrypted")) {
                    cleanName = cleanName.slice(0, -10);
                } else {
                    cleanName = "decrypted_" + cleanName;
                }

                downloadLink.href = downloadURL;
                downloadLink.download = cleanName;

                downloadTitle.textContent = "Decryption complete";
                downloadSubtitle.textContent = "Your original file was safely restored!";
                downloadSuccessIcon.textContent = "🔓";
                status.textContent = "File decrypted successfully.";
                status.className = "status success";
                downloadArea.classList.add("visible");
                showToast("Decryption verified & restored!");

                // Clear the password field after successful decryption
                resetPasswordField();
            }
        } catch (err) {
            console.error(err);
            if (currentMode === "decrypt") {
                status.textContent = "Decryption failed! Incorrect password or corrupted file.";
            } else {
                status.textContent = "Encryption failed. Please try again.";
            }
            status.className = "status error";
        } finally {
            actionBtn.disabled = false;
            actionBtn.classList.remove("encrypting");
            actionBtnText.textContent = currentMode === "encrypt" ? "Encrypt File" : "Decrypt File";
        }
    });
});

/* =========================================================================
   HOW TO USE CINEMATIC VIDEO (8.0 SECONDS WALKTHROUGH)
========================================================================= */
const pCanvas = document.getElementById("portalMovieCanvas");
const pCtx = pCanvas.getContext("2d");

const portalOverlay = document.getElementById("portalOverlay");
const playPortalBtn = document.getElementById("playPortalBtn");
const portalPlayToggle = document.getElementById("portalPlayToggle");
const portalPlayIcon = document.getElementById("portalPlayIcon");
const portalProgress = document.getElementById("portalProgress");
const portalScrubber = document.getElementById("portalScrubber");
const portalTimeline = document.getElementById("portalTimeline");
const portalTimeText = document.getElementById("portalTimeText");
const portalPhaseText = document.getElementById("portalPhaseText");
const portalReplayBtn = document.getElementById("portalReplayBtn");
const overlayCaption = document.getElementById("overlayCaption");
const stepCards = document.querySelectorAll(".step-card");

const HOW_TO_DURATION = 8.0;
let howToTime = 0;
let isHowToPlaying = false;
let lastHowToTimestamp = null;

function resizeHowToCanvas() {
    pCanvas.width = pCanvas.parentElement.clientWidth;
    pCanvas.height = pCanvas.parentElement.clientHeight;
}
window.addEventListener("resize", resizeHowToCanvas);
resizeHowToCanvas();

function drawHowToScene(t) {
    const W = pCanvas.width;
    const H = pCanvas.height;
    const cx = W / 2;
    const cy = H / 2;

    pCtx.fillStyle = "#060609";
    pCtx.fillRect(0, 0, W, H);

    pCtx.strokeStyle = "rgba(255, 107, 0, 0.04)";
    pCtx.lineWidth = 1;
    for (let x = 0; x < W; x += 45) {
        pCtx.beginPath(); pCtx.moveTo(x, 0); pCtx.lineTo(x, H); pCtx.stroke();
    }
    for (let y = 0; y < H; y += 45) {
        pCtx.beginPath(); pCtx.moveTo(0, y); pCtx.lineTo(W, y); pCtx.stroke();
    }

    let activeStep = 1;
    if (t < 2.0) activeStep = 1;
    else if (t < 4.0) activeStep = 2;
    else if (t < 6.0) activeStep = 3;
    else activeStep = 4;

    stepCards.forEach(c => {
        if (parseInt(c.dataset.step) === activeStep) c.classList.add("active");
        else c.classList.remove("active");
    });

    /* STEP 1: SELECT FILE (0.0s - 2.0s) */
    if (t < 2.0) {
        portalPhaseText.textContent = "STEP 1: SELECT OR DROP FILE";

        pCtx.strokeStyle = "#444";
        pCtx.setLineDash([6, 6]);
        pCtx.strokeRect(cx - 160, cy - 100, 320, 200);
        pCtx.setLineDash([]);

        const dropProg = Math.min(1, t / 1.4);
        const fileY = (cy - 160) + dropProg * 130;
        drawDemoDoc(cx - 35, fileY, false);
        drawDemoCursor(cx + 20, fileY + 30);

        pCtx.fillStyle = "#ffaa00";
        pCtx.font = "bold 15px sans-serif";
        pCtx.textAlign = "center";
        pCtx.fillText("Drag your file or browse from device", cx, cy + 60);
    }

    /* STEP 2: SET PASSWORD (2.0s - 4.0s) */
    else if (t >= 2.0 && t < 4.0) {
        portalPhaseText.textContent = "STEP 2: SET SECRET PASSWORD";

        pCtx.fillStyle = "#121218";
        pCtx.strokeStyle = "#ff6b00";
        pCtx.lineWidth = 2;
        pCtx.beginPath();
        pCtx.roundRect(cx - 150, cy - 40, 300, 50, 8);
        pCtx.fill();
        pCtx.stroke();

        const charsTyped = Math.floor((t - 2.0) * 5);
        const dots = "••••••••••••".slice(0, Math.min(10, charsTyped + 2));

        pCtx.fillStyle = "#fff";
        pCtx.font = "20px monospace";
        pCtx.textAlign = "left";
        pCtx.fillText(dots, cx - 130, cy - 8);

        pCtx.fillStyle = "#888";
        pCtx.font = "12px monospace";
        pCtx.textAlign = "center";
        pCtx.fillText("PBKDF2 (SHA-256) 100,000 Iterations", cx, cy + 40);

        drawDemoDoc(cx - 35, cy - 140, false, 0.7);
    }

    /* STEP 3: RUN BROWSER CRYPTO (4.0s - 6.0s) */
    else if (t >= 4.0 && t < 6.0) {
        portalPhaseText.textContent = "STEP 3: RUN LOCAL WEBCRYPTO";
        drawDemoVortex(cx, cy, 90, t);
        drawDemoDoc(cx - 25, cy - 40, true, 0.85);

        pCtx.fillStyle = "#22c55e";
        pCtx.font = "bold 14px monospace";
        pCtx.textAlign = "center";
        pCtx.fillText("AES-256-GCM QUANTUM PROCESS", cx, cy + 130);
    }

    /* STEP 4: DOWNLOAD CLEAN FILE (6.0s - 8.0s) */
    else {
        portalPhaseText.textContent = "STEP 4: INSTANT SECURE DOWNLOAD";
        drawDemoDoc(cx - 40, cy - 80, true, 1.1);

        pCtx.fillStyle = "#22c55e";
        pCtx.shadowColor = "#22c55e";
        pCtx.shadowBlur = 15;
        pCtx.beginPath();
        pCtx.roundRect(cx - 85, cy + 50, 170, 44, 8);
        pCtx.fill();
        pCtx.shadowBlur = 0;

        pCtx.fillStyle = "#041408";
        pCtx.font = "bold 13px sans-serif";
        pCtx.textAlign = "center";
        pCtx.fillText("⬇ Download File", cx, cy + 77);
    }
}

function drawDemoDoc(x, y, isEncrypted, scale = 1) {
    pCtx.save();
    pCtx.translate(x, y);
    pCtx.scale(scale, scale);

    pCtx.fillStyle = isEncrypted ? "#142217" : "#1a1a22";
    pCtx.strokeStyle = isEncrypted ? "#22c55e" : "#ff6b00";
    pCtx.lineWidth = 2;
    pCtx.beginPath();
    pCtx.roundRect(0, 0, 70, 95, 6);
    pCtx.fill();
    pCtx.stroke();

    pCtx.fillStyle = isEncrypted ? "rgba(34, 197, 94, 0.4)" : "rgba(255, 107, 0, 0.4)";
    pCtx.fillRect(10, 18, 50, 4);
    pCtx.fillRect(10, 30, 50, 4);
    pCtx.fillRect(10, 42, 38, 4);

    pCtx.fillStyle = isEncrypted ? "#22c55e" : "#ff6b00";
    pCtx.font = "bold 16px sans-serif";
    pCtx.textAlign = "center";
    pCtx.fillText(isEncrypted ? "🔒" : "📄", 35, 75);

    pCtx.restore();
}

function drawDemoCursor(x, y) {
    pCtx.save();
    pCtx.translate(x, y);
    pCtx.fillStyle = "#ffffff";
    pCtx.strokeStyle = "#000000";
    pCtx.lineWidth = 1.5;
    pCtx.beginPath();
    pCtx.moveTo(0, 0); pCtx.lineTo(0, 18); pCtx.lineTo(5, 14); pCtx.lineTo(9, 22);
    pCtx.lineTo(13, 20); pCtx.lineTo(8, 12); pCtx.lineTo(14, 12);
    pCtx.closePath();
    pCtx.fill();
    pCtx.stroke();
    pCtx.restore();
}

function drawDemoVortex(cx, cy, rad, t) {
    pCtx.save();
    pCtx.translate(cx, cy);
    const grad = pCtx.createRadialGradient(0, 0, rad * 0.2, 0, 0, rad * 1.3);
    grad.addColorStop(0, "#000000");
    grad.addColorStop(0.6, "#ff6b00");
    grad.addColorStop(1, "transparent");

    pCtx.fillStyle = grad;
    pCtx.beginPath();
    pCtx.arc(0, 0, rad * 1.3, 0, Math.PI * 2);
    pCtx.fill();

    for (let r = 0; r < 3; r++) {
        pCtx.rotate(t * 4 + r);
        pCtx.strokeStyle = "#ffaa00";
        pCtx.lineWidth = 2.5;
        pCtx.beginPath();
        pCtx.arc(0, 0, rad * (0.6 + r * 0.2), 0, Math.PI * 1.5);
        pCtx.stroke();
    }
    pCtx.restore();
}

function animateHowToVideo(timestamp) {
    if (!lastHowToTimestamp) lastHowToTimestamp = timestamp;
    const delta = (timestamp - lastHowToTimestamp) / 1000;
    lastHowToTimestamp = timestamp;

    if (isHowToPlaying) {
        howToTime += delta;
        if (howToTime >= HOW_TO_DURATION) {
            howToTime = HOW_TO_DURATION;
            pauseHowToVideo();
            overlayCaption.textContent = "✓ Replay 'How to Use' Guide";
            portalOverlay.classList.remove("hidden");
        }
        updateHowToTimelineUI();
    }

    drawHowToScene(howToTime);
    requestAnimationFrame(animateHowToVideo);
}
requestAnimationFrame(animateHowToVideo);

function updateHowToTimelineUI() {
    const pct = (howToTime / HOW_TO_DURATION) * 100;
    portalProgress.style.width = `${pct}%`;
    portalScrubber.style.left = `${pct}%`;

    const sec = Math.floor(howToTime);
    const ms = Math.floor((howToTime % 1) * 10);
    portalTimeText.textContent = `00:0${sec}.${ms} / 00:08.0`;
}

function playHowToVideo() {
    if (howToTime >= HOW_TO_DURATION) howToTime = 0;
    isHowToPlaying = true;
    portalOverlay.classList.add("hidden");
    portalPlayIcon.textContent = "⏸";
}

function pauseHowToVideo() {
    isHowToPlaying = false;
    portalPlayIcon.textContent = "▶";
}

playPortalBtn.addEventListener("click", playHowToVideo);
portalOverlay.addEventListener("click", (e) => {
    if (e.target !== playPortalBtn) playHowToVideo();
});

portalPlayToggle.addEventListener("click", () => {
    if (isHowToPlaying) pauseHowToVideo();
    else playHowToVideo();
});

portalReplayBtn.addEventListener("click", () => {
    howToTime = 0;
    playHowToVideo();
});

portalTimeline.addEventListener("click", (e) => {
    const rect = portalTimeline.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    howToTime = ratio * HOW_TO_DURATION;
    updateHowToTimelineUI();
    drawHowToScene(howToTime);
});

stepCards.forEach(card => {
    card.addEventListener("click", () => {
        const step = parseInt(card.dataset.step);
        howToTime = (step - 1) * 2.0;
        updateHowToTimelineUI();
        drawHowToScene(howToTime);
        if (!isHowToPlaying) playHowToVideo();
    });
});

/* ===================================================
   PORTAL LOGIN MODAL
=================================================== */
loginBtn.addEventListener("click", () => portalModal.classList.add("open"));
closeModalBtn.addEventListener("click", () => portalModal.classList.remove("open"));
portalModal.addEventListener("click", (e) => {
    if (e.target === portalModal) portalModal.classList.remove("open");
});
portalConnectBtn.addEventListener("click", () => {
    portalConnectBtn.textContent = "Verifying Handshake...";
    setTimeout(() => {
        portalModal.classList.remove("open");
        portalConnectBtn.textContent = "Initialize Secure Handshake";
        showToast("Connected to Zero-Knowledge Portal");
    }, 1000);
});

/* ===================================================
   NAVIGATION & UI SCROLL
=================================================== */
startTransferBtn.addEventListener("click", () => {
    dropBox.scrollIntoView({ behavior: "smooth", block: "center" });
});

watchHowToBtn.addEventListener("click", () => {
    document.getElementById("how-to-use").scrollIntoView({ behavior: "smooth" });
    if (!isHowToPlaying) playHowToVideo();
});

document.querySelectorAll(".faq-question").forEach(btn => {
    btn.addEventListener("click", () => btn.parentElement.classList.toggle("active"));
});

/* ===================================================
   PARALLAX MOTION (WITH SAFETY CHECKS)
=================================================== */
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!prefersReducedMotion) {
    let mouseX = 0, mouseY = 0, currentX = 0, currentY = 0;

    window.addEventListener("mousemove", (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    function animateParallax() {
        currentX += (mouseX - currentX) * 0.05;
        currentY += (mouseY - currentY) * 0.05;

        document.documentElement.style.setProperty("--hero-x", `${currentX * 3}px`);
        document.documentElement.style.setProperty("--hero-y", `${currentY * 3}px`);
        document.documentElement.style.setProperty("--card-x", `${currentX * -4}px`);
        document.documentElement.style.setProperty("--card-y", `${currentY * -4}px`);

        const glowOne = document.querySelector(".glow-one");
        const glowTwo = document.querySelector(".glow-two");
        if (glowOne) glowOne.style.transform = `translate(${currentX * 15}px, ${currentY * 15}px)`;
        if (glowTwo) glowTwo.style.transform = `translate(${currentX * -15}px, ${currentY * -15}px)`;

        requestAnimationFrame(animateParallax);
    }
    animateParallax();

    window.addEventListener("scroll", () => {
        document.documentElement.style.setProperty("--grid-y", `${window.scrollY * 0.08}px`);
    });
}