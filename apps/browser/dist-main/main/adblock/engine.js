"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initBlocker = initBlocker;
exports.getBlocker = getBlocker;
exports.resetBlocker = resetBlocker;
const adblocker_electron_1 = require("@cliqz/adblocker-electron");
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const fs_1 = __importDefault(require("fs"));
const https_1 = __importDefault(require("https"));
let blocker = null;
function fetchText(url) {
    return new Promise((resolve, reject) => {
        https_1.default.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk.toString(); });
            res.on('end', () => resolve(data));
            res.on('error', reject);
        }).on('error', reject);
    });
}
const MINIMAL_FILTERS = `
! Vyro minimal blocklist
||ads.google.com^
||doubleclick.net^
||googlesyndication.com^
||adnxs.com^
||facebook.com/tr^
||google-analytics.com^
`;
async function initBlocker() {
    if (blocker)
        return blocker;
    const cachePath = path_1.default.join(electron_1.app.getPath('userData'), 'adblocker.cache');
    try {
        if (fs_1.default.existsSync(cachePath)) {
            const serialized = fs_1.default.readFileSync(cachePath);
            blocker = adblocker_electron_1.ElectronBlocker.deserialize(new Uint8Array(serialized));
            return blocker;
        }
    }
    catch {
    }
    try {
        const fetchFn = async (url) => ({
            text: () => fetchText(url),
        });
        blocker = await adblocker_electron_1.ElectronBlocker.fromPrebuiltAdsAndTracking(fetchFn);
        fs_1.default.writeFileSync(cachePath, Buffer.from(blocker.serialize()));
        return blocker;
    }
    catch {
    }
    blocker = adblocker_electron_1.ElectronBlocker.parse(MINIMAL_FILTERS);
    return blocker;
}
function getBlocker() { return blocker; }
function resetBlocker() { blocker = null; }
