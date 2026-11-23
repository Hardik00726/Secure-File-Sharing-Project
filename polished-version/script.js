
/* =========================================================
   SECURESHARE — COMPLETE SCRIPT
   Encryption: PBKDF2 + AES-256-GCM
   Transfer: QR Code + Express Server
========================================================= */

/* =========================================================
   1. MODE & DOM SELECTORS
========================================================= */

let currentMode = "encrypt";

const $ = (id) => document.getElementById(id);

const modeEncryptBtn = $("modeEncryptBtn");
const modeDecryptBtn = $("modeDecryptBtn");
const cardLabel = $("cardLabel");
const cardHeading = $("cardHeading");
const passwordLabel = $("passwordLabel");
const strengthContainer = $("strengthContainer");
const actionBtn = $("actionBtn");
const actionBtnText = $("actionBtnText");
const actionLoader = $("actionLoader");
const footerLockIcon = $("footerLockIcon");
const footerCipherNote = $("footerCipherNote");
const floatingNoteTwoText = $("floatingNoteTwoText");

const dropBox = $("dropBox");
const fileInput = $("fileInput");
const fileInfo = $("fileInfo");
const passwordInput = $("passwordInput");
const togglePassword = $("togglePassword");
const strengthBar = $("strengthBar");
const strengthText = $("strengthText");
const status = $("status");

const downloadArea = $("downloadArea");
const downloadLink = $("downloadLink");
const downloadTitle = $("downloadTitle");
const downloadSubtitle = $("downloadSubtitle");
const downloadSuccessIcon = $("downloadSuccessIcon");

const startTransferBtn = $("startTransferBtn");
const watchHowToBtn = $("watchHowToBtn");
const loginBtn = $("loginBtn");

const uploadTitle = $("uploadTitle");
const uploadDescription = $("uploadDescription");
const uploadIcon = $("uploadIcon");
const toastContainer = $("toastContainer");

const portalModal = $("portalModal");
const closeModalBtn = $("closeModalBtn");
const portalConnectBtn = $("portalConnectBtn");

/* QR elements */

const qrTransferPanel = $("qrTransferPanel");
const generateQRBtn = $("generateQRBtn");
const qrResult = $("qrResult");
const qrCodeBox = $("qrCode");
const qrShareStatus = $("qrShareStatus");
const copyQRLinkBtn = $("copyQRLink");

/* Application state */

let selectedFile = null;
let downloadURL = null;

let latestEncryptedBlob = null;
let latestEncryptedName = "";
let currentShareURL = "";


/* =========================================================
   2. GENERAL UTILITIES
========================================================= */

function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const units = ["Bytes", "KB", "MB", "GB", "TB"];
    const index = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        units.length - 1
    );

    const size = bytes / Math.pow(1024, index);

    return `${size.toFixed(size >= 10 || index === 0 ? 0 : 2)} ${units[index]}`;
}

function showToast(message) {
    if (!toastContainer) return;

    const toast = document.createElement("div");
    toast.className = "toast";

    const icon = document.createElement("span");
    icon.textContent = "🔒";

    const text = document.createElement("span");
    text.textContent = message;

    toast.append(icon, text);
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(6px)";
        toast.style.transition = "all 0.3s ease";

        setTimeout(() => toast.remove(), 300);
    }, 2800);
}

function setStatus(message, type = "") {
    if (!status) return;

    status.textContent = message;
    status.className = "status";

    if (type) status.classList.add(type);
}

function resetPasswordField() {
    if (passwordInput) {
        passwordInput.value = "";
        passwordInput.type = "password";
    }

    if (togglePassword) {
        togglePassword.textContent = "Show";
    }

    if (strengthBar) {
        strengthBar.style.width = "0%";
    }

    if (strengthText) {
        strengthText.textContent = "Strength: none";
        strengthText.style.color = "#666";
    }
}

function clearPreviousDownload() {
    if (downloadURL) {
        URL.revokeObjectURL(downloadURL);
        downloadURL = null;
    }

    if (downloadArea) {
        downloadArea.classList.remove("visible");
    }
}

function clearQRTransfer() {
    latestEncryptedBlob = null;
    latestEncryptedName = "";
    currentShareURL = "";

    if (qrResult) qrResult.classList.remove("visible");
    if (qrCodeBox) qrCodeBox.innerHTML = "";

    if (qrShareStatus) {
        qrShareStatus.textContent = "";
    }

    if (generateQRBtn) {
        generateQRBtn.disabled = false;
        generateQRBtn.textContent = "Generate Transfer QR";
    }
}


/* =========================================================
   3. MODE SWITCHING
========================================================= */

function setMode(mode) {
    currentMode = mode;

    clearPreviousDownload();
    clearQRTransfer();
    resetPasswordField();

    setStatus("");

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

    uploadTitle.textContent = selectedFile
        ? "File selected"
        : "Drop your file here";
}

modeEncryptBtn.addEventListener("click", () => setMode("encrypt"));
modeDecryptBtn.addEventListener("click", () => setMode("decrypt"));


/* =========================================================
   4. FILE SELECTION
========================================================= */

function selectFile(file) {
    if (!file) return;

    selectedFile = file;

    clearPreviousDownload();
    clearQRTransfer();

    fileInfo.textContent =
        `${file.name} • ${formatFileSize(file.size)}`;

    fileInfo.classList.add("visible");

    uploadTitle.textContent = "File selected";
    uploadDescription.textContent = `Ready for ${currentMode}`;

    if (uploadIcon) uploadIcon.textContent = "✓";

    setStatus(`File loaded for ${currentMode}.`);

    showToast(`Loaded: ${file.name}`);
}

/* Open file picker */

dropBox.addEventListener("click", (event) => {
    if (event.target.closest("button, input, a")) return;

    fileInput.click();
});

/* File picker selection */

fileInput.addEventListener("change", () => {
    if (fileInput.files && fileInput.files[0]) {
        selectFile(fileInput.files[0]);
    }
});

/* Drag over */

dropBox.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropBox.classList.add("dragging");
});

/* Drag leave */

dropBox.addEventListener("dragleave", () => {
    dropBox.classList.remove("dragging");
});

/* Drop file */

dropBox.addEventListener("drop", (event) => {
    event.preventDefault();
    dropBox.classList.remove("dragging");

    if (event.dataTransfer.files.length) {
        selectFile(event.dataTransfer.files[0]);
    }
});


/* =========================================================
   5. PASSWORD VISIBILITY
========================================================= */

togglePassword.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";

    passwordInput.type = isHidden ? "text" : "password";
    togglePassword.textContent = isHidden ? "Hide" : "Show";
});


/* =========================================================
   6. PASSWORD STRENGTH
========================================================= */

passwordInput.addEventListener("input", () => {
    if (currentMode === "decrypt") return;

    const value = passwordInput.value;
    let score = 0;

    if (value.length > 5) score++;
    if (value.length > 9) score++;
    if (/[A-Z]/.test(value) && /[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;

    if (!value.length) {
        strengthBar.style.width = "0%";
        strengthText.textContent = "Strength: none";
        strengthText.style.color = "#666";

    } else if (score <= 1) {
        strengthBar.style.width = "25%";
        strengthBar.style.backgroundColor = "#d87575";

        strengthText.textContent = "Strength: Weak";
        strengthText.style.color = "#d87575";

    } else if (score <= 3) {
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


/* =========================================================
   7. CINEMATIC HERO PORTAL
========================================================= */

const heroPortalOverlay = $("heroPortalOverlay");
const heroPortalCanvas = $("heroPortalCanvas");
const heroPortalCtx = heroPortalCanvas.getContext("2d");
const heroPortalStatus = $("heroPortalStatus");
const skipPortalBtn = $("skipPortalBtn");

let portalAnimationId = null;
let portalStartTime = 0;

const PORTAL_DURATION = 4.8;
const sparks = [];

function resizeHeroPortal() {
    heroPortalCanvas.width = window.innerWidth;
    heroPortalCanvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeHeroPortal);
resizeHeroPortal();

function createSparks(
    cx,
    cy,
    count,
    speedMult = 1,
    colorA = "#ffaa00",
    colorB = "#ff4400"
) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (2 + Math.random() * 8) * speedMult;

        sparks.push({
            x: cx + Math.cos(angle) * (20 + Math.random() * 80),
            y: cy + Math.sin(angle) * (20 + Math.random() * 80),

            vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 2,
            vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 2,

            life: 1,
            decay: 0.015 + Math.random() * 0.03,
            size: 1.5 + Math.random() * 2.5,

            color: Math.random() > 0.3 ? colorA : colorB
        });
    }
}

function drawFloatingPortalDoc(x, y, scale, time, isDecrypt) {
    heroPortalCtx.save();

    heroPortalCtx.translate(x, y + Math.sin(time * 6) * 6);
    heroPortalCtx.scale(scale, scale);

    heroPortalCtx.fillStyle = "#121216";
    heroPortalCtx.strokeStyle = isDecrypt
        ? "rgba(56,189,248,0.8)"
        : "rgba(255,170,0,0.8)";

    heroPortalCtx.lineWidth = 2.5;
    heroPortalCtx.shadowColor = isDecrypt ? "#38bdf8" : "#ff8800";
    heroPortalCtx.shadowBlur = 20;

    heroPortalCtx.beginPath();
    heroPortalCtx.roundRect(-35, -50, 70, 100, 6);
    heroPortalCtx.fill();
    heroPortalCtx.stroke();

    heroPortalCtx.shadowBlur = 0;

    heroPortalCtx.fillStyle = isDecrypt
        ? "rgba(56,189,248,0.6)"
        : "rgba(255,200,100,0.6)";

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

function renderHeroPortalFrame(timestamp) {
    if (!portalStartTime) portalStartTime = timestamp;

    const elapsed = (timestamp - portalStartTime) / 1000;
    const progress = Math.min(elapsed / PORTAL_DURATION, 1);

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

        heroPortalStatus.textContent = isDecrypt
            ? "SYNCHRONIZING DECRYPTION KEY..."
            : "OPENING QUANTUM TUNNEL...";

        createSparks(cx, cy, 5, 1.2, primaryColor, secondaryColor);

    } else if (progress < 0.75) {
        radius = 160 + Math.sin(elapsed * 10) * 6;
        coreDarkness = 1;

        heroPortalStatus.textContent = isDecrypt
            ? "UNPACKING AES-256 CIPHERTEXT..."
            : "ENCRYPTING DATA BLOCKS (AES-256)...";

        createSparks(cx, cy, 3, 0.8, primaryColor, secondaryColor);

    } else {
        const t = (progress - 0.75) / 0.25;

        radius = Math.max(0, 160 * (1 - t));
        coreDarkness = 1 - t;

        heroPortalStatus.textContent = isDecrypt
            ? "RESTORING ORIGINAL DOCUMENT..."
            : "SEALING ENCRYPTED CONTAINER...";

        createSparks(cx, cy, 6, 1.8, primaryColor, secondaryColor);
    }

    if (radius > 1) {
        const glow = heroPortalCtx.createRadialGradient(
            cx, cy, radius * 0.4,
            cx, cy, radius * 1.5
        );

        if (isDecrypt) {
            glow.addColorStop(0, "rgba(56,189,248,0)");
            glow.addColorStop(0.7, "rgba(56,189,248,0.4)");
            glow.addColorStop(0.9, "rgba(2,132,199,0.2)");
        } else {
            glow.addColorStop(0, "rgba(255,120,0,0)");
            glow.addColorStop(0.7, "rgba(255,140,0,0.5)");
            glow.addColorStop(0.9, "rgba(255,60,0,0.3)");
        }

        glow.addColorStop(1, "rgba(0,0,0,0)");

        heroPortalCtx.fillStyle = glow;
        heroPortalCtx.beginPath();
        heroPortalCtx.arc(cx, cy, radius * 1.5, 0, Math.PI * 2);
        heroPortalCtx.fill();

        heroPortalCtx.fillStyle =
            `rgba(5,3,2,${0.9 * coreDarkness})`;

        heroPortalCtx.beginPath();
        heroPortalCtx.arc(cx, cy, radius * 0.85, 0, Math.PI * 2);
        heroPortalCtx.fill();

        heroPortalCtx.save();
        heroPortalCtx.translate(cx, cy);

        for (let i = 0; i < 4; i++) {
            heroPortalCtx.rotate(elapsed * 2.5 + (i * Math.PI) / 2);

            heroPortalCtx.strokeStyle =
                i % 2 === 0 ? primaryColor : secondaryColor;

            heroPortalCtx.lineWidth =
                3 + Math.sin(elapsed * 8 + i) * 1.5;

            heroPortalCtx.beginPath();
            heroPortalCtx.arc(
                0, 0,
                radius * (0.8 + i * 0.05),
                0,
                Math.PI * 1.6
            );

            heroPortalCtx.stroke();
        }

        heroPortalCtx.restore();

        if (progress > 0.2 && progress < 0.85) {
            const docScale =
                progress < 0.35 ? (progress - 0.2) / 0.15 : 1;

            drawFloatingPortalDoc(cx, cy, docScale, elapsed, isDecrypt);
        }
    }

    for (let i = sparks.length - 1; i >= 0; i--) {
        const spark = sparks[i];

        spark.x += spark.vx;
        spark.y += spark.vy;
        spark.life -= spark.decay;

        if (spark.life <= 0) {
            sparks.splice(i, 1);
            continue;
        }

        heroPortalCtx.fillStyle = spark.color;
        heroPortalCtx.shadowColor = spark.color;
        heroPortalCtx.shadowBlur = 8;

        heroPortalCtx.beginPath();
        heroPortalCtx.arc(
            spark.x,
            spark.y,
            spark.size * spark.life,
            0,
            Math.PI * 2
        );

        heroPortalCtx.fill();
        heroPortalCtx.shadowBlur = 0;
    }

    if (progress < 1) {
        portalAnimationId = requestAnimationFrame(renderHeroPortalFrame);
    } else {
        closeHeroPortal(true);
    }
}

function startHeroPortal(onComplete) {
    resizeHeroPortal();

    heroPortalOverlay.classList.add("active");

    portalStartTime = 0;
    sparks.length = 0;

    window._onPortalFinish = onComplete;

    portalAnimationId = requestAnimationFrame(renderHeroPortalFrame);
}

function closeHeroPortal(triggerCallback = true) {
    if (portalAnimationId) {
        cancelAnimationFrame(portalAnimationId);
        portalAnimationId = null;
    }

    heroPortalOverlay.classList.remove("active");

    const callback = window._onPortalFinish;
    window._onPortalFinish = null;

    if (triggerCallback && callback) {
        callback();
    }
}

skipPortalBtn.addEventListener("click", () => {
    closeHeroPortal(true);
});


/* =========================================================
   8. REAL WEBCRYPTO ENCRYPTION & DECRYPTION
========================================================= */

actionBtn.addEventListener("click", async (event) => {
    event.stopPropagation();

    if (!selectedFile) {
        setStatus("Please select a file first.", "error");
        return;
    }

    const password = passwordInput.value;

    if (!password.trim()) {
        setStatus(
            `Please enter the ${currentMode === "encrypt" ? "encryption" : "decryption"} password.`,
            "error"
        );

        passwordInput.focus();
        return;
    }

    if (!window.crypto || !window.crypto.subtle) {
        setStatus(
            "Secure encryption requires HTTPS or localhost.",
            "error"
        );
        return;
    }

    actionBtn.disabled = true;
    actionBtn.classList.add("encrypting");

    actionBtnText.textContent =
        currentMode === "encrypt" ? "Encrypting..." : "Decrypting...";

    setStatus("Preparing secure browser encryption...");

    const fileToProcess = selectedFile;
    const operationMode = currentMode;

    startHeroPortal(async () => {
        try {
            const fileData = await fileToProcess.arrayBuffer();

            const passwordKey = await crypto.subtle.importKey(
                "raw",
                new TextEncoder().encode(password),
                "PBKDF2",
                false,
                ["deriveKey"]
            );

            if (operationMode === "encrypt") {
                const salt = crypto.getRandomValues(new Uint8Array(16));
                const iv = crypto.getRandomValues(new Uint8Array(12));

                const encryptionKey = await crypto.subtle.deriveKey(
                    {
                        name: "PBKDF2",
                        salt,
                        iterations: 100000,
                        hash: "SHA-256"
                    },
                    passwordKey,
                    {
                        name: "AES-GCM",
                        length: 256
                    },
                    false,
                    ["encrypt"]
                );

                const encryptedData = await crypto.subtle.encrypt(
                    {
                        name: "AES-GCM",
                        iv
                    },
                    encryptionKey,
                    fileData
                );

                const combinedData = new Uint8Array(
                    16 + 12 + encryptedData.byteLength
                );

                combinedData.set(salt, 0);
                combinedData.set(iv, 16);
                combinedData.set(new Uint8Array(encryptedData), 28);

                const encryptedBlob = new Blob(
                    [combinedData],
                    { type: "application/octet-stream" }
                );

                // Save encrypted file for QR transfer.
                latestEncryptedBlob = encryptedBlob;
                latestEncryptedName = fileToProcess.name + ".encrypted";

                if (downloadURL) URL.revokeObjectURL(downloadURL);

                downloadURL = URL.createObjectURL(encryptedBlob);

                downloadLink.href = downloadURL;
                downloadLink.download = latestEncryptedName;

                downloadTitle.textContent = "Encryption complete";
                downloadSubtitle.textContent =
                    "Your encrypted payload is ready for safe transmission.";

                downloadSuccessIcon.textContent = "✓";

                setStatus("File encrypted successfully.", "success");

                downloadArea.classList.add("visible");
                const qrPanel = document.getElementById("qrTransferPanel");
 
                    if (qrPanel) {
                    qrPanel.style.display = "block";
                    qrPanel.classList.add("visible");
                    }      

                showToast("AES-256 File Sealed & Ready!");

                resetPasswordField();

            } else {
                // DECRYPTION

                const rawBytes = new Uint8Array(fileData);

                if (rawBytes.length < 28) {
                    throw new Error("Invalid encrypted file.");
                }

                const salt = rawBytes.slice(0, 16);
                const iv = rawBytes.slice(16, 28);
                const ciphertext = rawBytes.slice(28);

                const decryptionKey = await crypto.subtle.deriveKey(
                    {
                        name: "PBKDF2",
                        salt,
                        iterations: 100000,
                        hash: "SHA-256"
                    },
                    passwordKey,
                    {
                        name: "AES-GCM",
                        length: 256
                    },
                    false,
                    ["decrypt"]
                );

                const decryptedData = await crypto.subtle.decrypt(
                    {
                        name: "AES-GCM",
                        iv
                    },
                    decryptionKey,
                    ciphertext
                );

                const decryptedBlob = new Blob([decryptedData], {
                    type: "application/octet-stream"
                });

                if (downloadURL) URL.revokeObjectURL(downloadURL);

                downloadURL = URL.createObjectURL(decryptedBlob);

                let cleanName = fileToProcess.name;

                if (cleanName.endsWith(".encrypted")) {
                    cleanName = cleanName.slice(0, -10);
                } else {
                    cleanName = "decrypted_" + cleanName;
                }

                downloadLink.href = downloadURL;
                downloadLink.download = cleanName;

                downloadTitle.textContent = "Decryption complete";
                downloadSubtitle.textContent =
                    "Your original file was safely restored!";

                downloadSuccessIcon.textContent = "🔓";

                setStatus("File decrypted successfully.", "success");

                downloadArea.classList.add("visible");

                showToast("Decryption verified & restored!");

                resetPasswordField();
            }

        } catch (error) {
            console.error("SecureShare operation failed:", error);

            if (operationMode === "decrypt") {
                setStatus(
                    "Decryption failed! Incorrect password or corrupted file.",
                    "error"
                );
            } else {
                setStatus("Encryption failed. Please try again.", "error");
            }

        } finally {
            actionBtn.disabled = false;
            actionBtn.classList.remove("encrypting");

            actionBtnText.textContent =
                currentMode === "encrypt" ? "Encrypt File" : "Decrypt File";
        }
    });
});


/* =========================================================
   9. HOW TO USE ANIMATION
========================================================= */

const pCanvas = $("portalMovieCanvas");
const pCtx = pCanvas.getContext("2d");

const portalOverlay = $("portalOverlay");
const playPortalBtn = $("playPortalBtn");
const portalPlayToggle = $("portalPlayToggle");
const portalPlayIcon = $("portalPlayIcon");
const portalProgress = $("portalProgress");
const portalScrubber = $("portalScrubber");
const portalTimeline = $("portalTimeline");
const portalTimeText = $("portalTimeText");
const portalPhaseText = $("portalPhaseText");
const portalReplayBtn = $("portalReplayBtn");
const overlayCaption = $("overlayCaption");

const stepCards = document.querySelectorAll(".step-card");

const HOW_TO_DURATION = 8;

let howToTime = 0;
let isHowToPlaying = false;
let lastHowToTimestamp = null;

function resizeHowToCanvas() {
    pCanvas.width = pCanvas.parentElement.clientWidth;
    pCanvas.height = pCanvas.parentElement.clientHeight;
}

window.addEventListener("resize", resizeHowToCanvas);
resizeHowToCanvas();

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

    pCtx.fillStyle = isEncrypted
        ? "rgba(34,197,94,0.4)"
        : "rgba(255,107,0,0.4)";

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

    pCtx.fillStyle = "#fff";
    pCtx.strokeStyle = "#000";
    pCtx.lineWidth = 1.5;

    pCtx.beginPath();
    pCtx.moveTo(0, 0);
    pCtx.lineTo(0, 18);
    pCtx.lineTo(5, 14);
    pCtx.lineTo(9, 22);
    pCtx.lineTo(13, 20);
    pCtx.lineTo(8, 12);
    pCtx.lineTo(14, 12);
    pCtx.closePath();

    pCtx.fill();
    pCtx.stroke();

    pCtx.restore();
}

function drawDemoVortex(cx, cy, rad, t) {
    pCtx.save();
    pCtx.translate(cx, cy);

    const gradient = pCtx.createRadialGradient(
        0, 0, rad * 0.2,
        0, 0, rad * 1.3
    );

    gradient.addColorStop(0, "#000");
    gradient.addColorStop(0.6, "#ff6b00");
    gradient.addColorStop(1, "transparent");

    pCtx.fillStyle = gradient;

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

function drawHowToScene(t) {
    const W = pCanvas.width;
    const H = pCanvas.height;

    const cx = W / 2;
    const cy = H / 2;

    pCtx.fillStyle = "#060609";
    pCtx.fillRect(0, 0, W, H);

    pCtx.strokeStyle = "rgba(255,107,0,0.04)";
    pCtx.lineWidth = 1;

    for (let x = 0; x < W; x += 45) {
        pCtx.beginPath();
        pCtx.moveTo(x, 0);
        pCtx.lineTo(x, H);
        pCtx.stroke();
    }

    for (let y = 0; y < H; y += 45) {
        pCtx.beginPath();
        pCtx.moveTo(0, y);
        pCtx.lineTo(W, y);
        pCtx.stroke();
    }

    const activeStep = Math.min(4, Math.floor(t / 2) + 1);

    stepCards.forEach(card => {
        card.classList.toggle(
            "active",
            Number(card.dataset.step) === activeStep
        );
    });

    if (t < 2) {
        portalPhaseText.textContent = "STEP 1: SELECT OR DROP FILE";

        pCtx.strokeStyle = "#444";
        pCtx.setLineDash([6, 6]);
        pCtx.strokeRect(cx - 160, cy - 100, 320, 200);
        pCtx.setLineDash([]);

        const dropProgress = Math.min(1, t / 1.4);
        const fileY = cy - 160 + dropProgress * 130;

        drawDemoDoc(cx - 35, fileY, false);
        drawDemoCursor(cx + 20, fileY + 30);

        pCtx.fillStyle = "#ffaa00";
        pCtx.font = "bold 15px sans-serif";
        pCtx.textAlign = "center";

        pCtx.fillText(
            "Drag your file or browse from device",
            cx,
            cy + 60
        );

    } else if (t < 4) {
        portalPhaseText.textContent = "STEP 2: SET SECRET PASSWORD";

        pCtx.fillStyle = "#121218";
        pCtx.strokeStyle = "#ff6b00";
        pCtx.lineWidth = 2;

        pCtx.beginPath();
        pCtx.roundRect(cx - 150, cy - 40, 300, 50, 8);
        pCtx.fill();
        pCtx.stroke();

        const charsTyped = Math.floor((t - 2) * 5);
        const dots = "••••••••••••".slice(
            0,
            Math.min(10, charsTyped + 2)
        );

        pCtx.fillStyle = "#fff";
        pCtx.font = "20px monospace";
        pCtx.textAlign = "left";

        pCtx.fillText(dots, cx - 130, cy - 8);

        pCtx.fillStyle = "#888";
        pCtx.font = "12px monospace";
        pCtx.textAlign = "center";

        pCtx.fillText(
            "PBKDF2 (SHA-256) 100,000 Iterations",
            cx,
            cy + 40
        );

        drawDemoDoc(cx - 35, cy - 140, false, 0.7);

    } else if (t < 6) {
        portalPhaseText.textContent = "STEP 3: RUN LOCAL WEBCRYPTO";

        drawDemoVortex(cx, cy, 90, t);
        drawDemoDoc(cx - 25, cy - 40, true, 0.85);

        pCtx.fillStyle = "#22c55e";
        pCtx.font = "bold 14px monospace";
        pCtx.textAlign = "center";

        pCtx.fillText(
            "AES-256-GCM QUANTUM PROCESS",
            cx,
            cy + 130
        );

    } else {
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

function updateHowToTimelineUI() {
    const pct = (howToTime / HOW_TO_DURATION) * 100;

    portalProgress.style.width = `${pct}%`;
    portalScrubber.style.left = `${pct}%`;

    const sec = Math.floor(howToTime);
    const ms = Math.floor((howToTime % 1) * 10);

    portalTimeText.textContent =
        `00:0${sec}.${ms} / 00:08.0`;
}

function pauseHowToVideo() {
    isHowToPlaying = false;
    portalPlayIcon.textContent = "▶";
}

function playHowToVideo() {
    if (howToTime >= HOW_TO_DURATION) {
        howToTime = 0;
    }

    isHowToPlaying = true;
    portalOverlay.classList.add("hidden");
    portalPlayIcon.textContent = "⏸";
}

function animateHowToVideo(timestamp) {
    if (!lastHowToTimestamp) {
        lastHowToTimestamp = timestamp;
    }

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

playPortalBtn.addEventListener("click", playHowToVideo);

portalOverlay.addEventListener("click", (event) => {
    if (event.target !== playPortalBtn) {
        playHowToVideo();
    }
});

portalPlayToggle.addEventListener("click", () => {
    if (isHowToPlaying) {
        pauseHowToVideo();
    } else {
        playHowToVideo();
    }
});

portalReplayBtn.addEventListener("click", () => {
    howToTime = 0;
    playHowToVideo();
});

portalTimeline.addEventListener("click", (event) => {
    const rect = portalTimeline.getBoundingClientRect();

    const ratio = Math.max(
        0,
        Math.min(1, (event.clientX - rect.left) / rect.width)
    );

    howToTime = ratio * HOW_TO_DURATION;

    updateHowToTimelineUI();
    drawHowToScene(howToTime);
});

stepCards.forEach(card => {
    card.addEventListener("click", () => {
        const step = Number(card.dataset.step);

        howToTime = (step - 1) * 2;

        updateHowToTimelineUI();
        drawHowToScene(howToTime);

        if (!isHowToPlaying) {
            playHowToVideo();
        }
    });
});


/* =========================================================
   10. LOGIN MODAL
========================================================= */

loginBtn.addEventListener("click", () => {
    portalModal.classList.add("open");
});

closeModalBtn.addEventListener("click", () => {
    portalModal.classList.remove("open");
});

portalModal.addEventListener("click", (event) => {
    if (event.target === portalModal) {
        portalModal.classList.remove("open");
    }
});

portalConnectBtn.addEventListener("click", () => {
    portalConnectBtn.textContent = "Verifying Handshake...";

    setTimeout(() => {
        portalModal.classList.remove("open");

        portalConnectBtn.textContent =
            "Initialize Secure Handshake";

        showToast("Connected to Zero-Knowledge Portal");
    }, 1000);
});


/* =========================================================
   11. NAVIGATION & FAQ
========================================================= */

startTransferBtn.addEventListener("click", () => {
    dropBox.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
});

watchHowToBtn.addEventListener("click", () => {
    $("how-to-use").scrollIntoView({
        behavior: "smooth"
    });

    if (!isHowToPlaying) {
        playHowToVideo();
    }
});

document.querySelectorAll(".faq-question").forEach(button => {
    button.addEventListener("click", () => {
        button.parentElement.classList.toggle("active");
    });
});


/* =========================================================
   12. PARALLAX MOTION
========================================================= */

const prefersReducedMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!prefersReducedMotion) {
    let mouseX = 0;
    let mouseY = 0;

    let currentX = 0;
    let currentY = 0;

    window.addEventListener("mousemove", (event) => {
        mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
    });

    function animateParallax() {
        currentX += (mouseX - currentX) * 0.05;
        currentY += (mouseY - currentY) * 0.05;

        document.documentElement.style.setProperty(
            "--hero-x",
            `${currentX * 3}px`
        );

        document.documentElement.style.setProperty(
            "--hero-y",
            `${currentY * 3}px`
        );

        document.documentElement.style.setProperty(
            "--card-x",
            `${currentX * -4}px`
        );

        document.documentElement.style.setProperty(
            "--card-y",
            `${currentY * -4}px`
        );

        const glowOne = document.querySelector(".glow-one");
        const glowTwo = document.querySelector(".glow-two");

        if (glowOne) {
            glowOne.style.transform =
                `translate(${currentX * 15}px, ${currentY * 15}px)`;
        }

        if (glowTwo) {
            glowTwo.style.transform =
                `translate(${currentX * -15}px, ${currentY * -15}px)`;
        }

        requestAnimationFrame(animateParallax);
    }

    animateParallax();

    window.addEventListener("scroll", () => {
        document.documentElement.style.setProperty(
            "--grid-y",
            `${window.scrollY * 0.08}px`
        );
    });
}


/* =========================================================
   13. QR CODE FILE TRANSFER
========================================================= */

generateQRBtn.addEventListener("click", async () => {
    if (!latestEncryptedBlob) {
        qrShareStatus.textContent =
            "Please encrypt a file first.";

        return;
    }

    if (typeof QRCode === "undefined") {
        qrShareStatus.textContent =
            "QR library could not load. Check your internet connection.";

        return;
    }

    generateQRBtn.disabled = true;
    generateQRBtn.textContent = "Uploading encrypted file...";

    qrShareStatus.textContent = "Preparing transfer...";

    try {
        const formData = new FormData();

        formData.append(
            "file",
            latestEncryptedBlob,
            latestEncryptedName
        );

        const response = await fetch("/api/share", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error || "Upload failed."
            );
        }

        if (!result.shareUrl) {
            throw new Error("Server did not return a share URL.");
        }

        currentShareURL = result.shareUrl;

        qrCodeBox.innerHTML = "";

        new QRCode(qrCodeBox, {
            text: currentShareURL,
            width: 220,
            height: 220,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
        });

        qrResult.classList.add("visible");

        qrShareStatus.textContent =
            "Encrypted file uploaded. QR code is ready!";

        generateQRBtn.textContent = "Generate New Transfer QR";

        showToast("Transfer QR generated successfully!");

    } catch (error) {
        console.error("QR Transfer Error:", error);

        qrShareStatus.textContent =
            error.message || "Unable to generate QR code.";

        generateQRBtn.textContent = "Try Again";

    } finally {
        generateQRBtn.disabled = false;
    }
});


/* =========================================================
   14. COPY TRANSFER LINK
========================================================= */

copyQRLinkBtn.addEventListener("click", async () => {
    if (!currentShareURL) return;

    try {
        await navigator.clipboard.writeText(currentShareURL);

        copyQRLinkBtn.textContent = "Copied!";

        setTimeout(() => {
            copyQRLinkBtn.textContent = "Copy Download Link";
        }, 2000);

    } catch (error) {
        console.error("Clipboard error:", error);

        qrShareStatus.textContent =
            "Copy failed. Link: " + currentShareURL;
    }
});


/* =========================================================
   15. INITIALIZATION
========================================================= */

setMode("encrypt");
drawHowToScene(0);
updateHowToTimelineUI();

console.log("SecureShare initialized successfully.");
