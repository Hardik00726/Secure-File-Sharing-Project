
const express = require("express");
const multer = require("multer");
const os = require("os");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();

const PORT = 3000;
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const EXPIRY_TIME = 60 * 60 * 1000;

const uploadDirectory = path.join(os.tmpdir(), "secureshare-transfers");

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

const transfers = new Map();

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, uploadDirectory);
    },
    filename: (req, file, callback) => {
        callback(null, crypto.randomUUID());
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE
    }
});



function getLocalIP() {
    const interfaces = os.networkInterfaces();
    const candidates = [];

    for (const [name, entries] of Object.entries(interfaces)) {
        for (const network of entries || []) {
            if (
                network.family === "IPv4" &&
                !network.internal &&
                (
                    network.address.startsWith("10.") ||
                    network.address.startsWith("192.168.") ||
                    /^172\.(1[6-9]|2\d|3[01])\./.test(network.address)
                )
            ) {
                candidates.push({
                    name,
                    address: network.address
                });
            }
        }
    }

    // Prefer the active Wi-Fi adapter.
    const wifi = candidates.find(item =>
        /wi-?fi|wireless/i.test(item.name)
    );

    return (wifi || candidates[0])?.address || "localhost";
}



// Serve the website files from polished-version
app.use(express.static(path.join(__dirname, "polished-version")));

// Upload encrypted file and create a temporary share link
app.post("/api/share", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            error: "No file was uploaded."
        });
    }

    const id = crypto.randomUUID();
    const expiresAt = Date.now() + EXPIRY_TIME;

    transfers.set(id, {
        filePath: req.file.path,
        fileName: req.file.originalname,
        expiresAt
    });

    const shareUrl =
        `http://${getLocalIP()}:${PORT}/api/download/${id}`;

    res.json({
        success: true,
        shareUrl,
        expiresIn: 3600
    });
});

// Download encrypted file
app.get("/api/download/:id", (req, res) => {
    const transfer = transfers.get(req.params.id);

    if (!transfer) {
        return res.status(404).send("Transfer link not found or expired.");
    }

    if (Date.now() > transfer.expiresAt) {
        if (fs.existsSync(transfer.filePath)) {
            fs.unlinkSync(transfer.filePath);
        }

        transfers.delete(req.params.id);

        return res.status(410).send("This transfer link has expired.");
    }

    if (!fs.existsSync(transfer.filePath)) {
        transfers.delete(req.params.id);
        return res.status(404).send("File is no longer available.");
    }

    res.download(transfer.filePath, transfer.fileName);
});

// Remove expired files every minute
setInterval(() => {
    for (const [id, transfer] of transfers.entries()) {
        if (Date.now() > transfer.expiresAt) {
            if (fs.existsSync(transfer.filePath)) {
                fs.unlinkSync(transfer.filePath);
            }

            transfers.delete(id);
        }
    }
}, 60 * 1000);

app.listen(PORT, "0.0.0.0", () => {
    console.log(`SecureShare server running on http://localhost:${PORT}`);
    console.log(`Local network IP: ${getLocalIP()}`);
});
