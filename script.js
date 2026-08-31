const dropBox = document.getElementById("dropBox");
const fileInput = document.getElementById("fileInput");
const fileInfo = document.getElementById("fileInfo");

const passwordInput = document.getElementById("passwordInput");
const encryptBtn = document.getElementById("encryptBtn");
const status = document.getElementById("status");

let selectedFile = null;


// Open file picker
dropBox.addEventListener("click", function (event) {

    if (event.target === encryptBtn) {
        return;
    }

    fileInput.click();
});


// When file is selected
fileInput.addEventListener("change", function () {

    selectedFile = fileInput.files[0];

    if (selectedFile) {

        fileInfo.textContent =
            "Selected: " + selectedFile.name +
            " | Size: " + selectedFile.size + " bytes";

        status.textContent = "File ready for encryption.";

    }

});


// Encrypt button
encryptBtn.addEventListener("click", async function (event) {

    event.stopPropagation();

    if (!selectedFile) {
        status.textContent = "Please select a file first.";
        return;
    }

    const password = passwordInput.value.trim();

    if (!password) {
        status.textContent = "Please enter a password.";
        return;
    }

    try {

        status.textContent = "Encrypting...";

        const fileData = await selectedFile.arrayBuffer();

        const salt = crypto.getRandomValues(
            new Uint8Array(16)
        );

        const iv = crypto.getRandomValues(
            new Uint8Array(12)
        );

        const passwordKey = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(password),
            "PBKDF2",
            false,
            ["deriveKey"]
        );

        const encryptionKey = await crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
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
                iv: iv
            },
            encryptionKey,
            fileData
        );

        const combinedData = new Uint8Array(
            salt.length +
            iv.length +
            encryptedData.byteLength
        );

        combinedData.set(salt, 0);

        combinedData.set(
            iv,
            salt.length
        );

        combinedData.set(
            new Uint8Array(encryptedData),
            salt.length + iv.length
        );

        const encryptedBlob = new Blob(
            [combinedData],
            {
                type: "application/octet-stream"
            }
        );

        const downloadURL =
            URL.createObjectURL(encryptedBlob);

        const downloadLink =
            document.createElement("a");

        downloadLink.href = downloadURL;

        downloadLink.download =
            selectedFile.name + ".encrypted";

        downloadLink.textContent =
            "Download Encrypted File";

        downloadLink.style.display = "block";

        document.body.appendChild(downloadLink);

        status.textContent =
            "✅ Encryption successful!";

    } catch (error) {

        console.error("Encryption error:", error);

        status.textContent =
            "❌ Encryption failed.";

    }

});