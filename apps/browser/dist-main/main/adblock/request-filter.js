"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAdblocking = setupAdblocking;
exports.reloadBlocklists = reloadBlocklists;
exports.incrementBlocked = incrementBlocked;
exports.getStats = getStats;
exports.setSiteOverride = setSiteOverride;
exports.getSiteOverride = getSiteOverride;
exports.getAllSiteOverrides = getAllSiteOverrides;
const engine_1 = require("./engine");
const stats = { totalBlocked: 0, trackersBlocked: 0, sessionBlocked: 0 };
const siteOverrides = new Map(); // origin → enabled
async function setupAdblocking(sess) {
    const blocker = await (0, engine_1.initBlocker)();
    blocker.enableBlockingInSession(sess);
}
async function reloadBlocklists(sess) {
    const { getBlocker } = await Promise.resolve().then(() => __importStar(require('./engine')));
    const currentBlocker = getBlocker();
    if (currentBlocker) {
        currentBlocker.disableBlockingInSession(sess);
    }
    (0, engine_1.resetBlocker)();
    const newBlocker = await (0, engine_1.initBlocker)();
    newBlocker.enableBlockingInSession(sess);
}
function incrementBlocked(isTracker = false) {
    stats.totalBlocked++;
    stats.sessionBlocked++;
    if (isTracker)
        stats.trackersBlocked++;
}
function getStats() { return { ...stats }; }
function setSiteOverride(origin, enabled) { siteOverrides.set(origin, enabled); }
function getSiteOverride(origin) { return siteOverrides.get(origin); }
function getAllSiteOverrides() {
    const result = {};
    siteOverrides.forEach((val, key) => { result[key] = val; });
    return result;
}
