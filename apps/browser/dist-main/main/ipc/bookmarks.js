"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBookmarksIpc = registerBookmarksIpc;
const electron_1 = require("electron");
const ipc_channels_1 = require("../../shared/ipc-channels");
const bookmark_service_1 = require("../services/bookmark-service");
const profile_service_1 = require("../services/profile-service");
function registerBookmarksIpc(db) {
    const bookmarkService = new bookmark_service_1.BookmarkService(db);
    const profileService = new profile_service_1.ProfileService(db);
    electron_1.ipcMain.handle(ipc_channels_1.IPC.BOOKMARKS_GET_TREE, () => {
        const profileId = profileService.getActive();
        return bookmarkService.getTree(profileId);
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.BOOKMARKS_ADD, (_event, { url, title, folderId, favicon }) => {
        const profileId = profileService.getActive();
        return bookmarkService.add(profileId, url, title, folderId, favicon);
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.BOOKMARKS_UPDATE, (_event, { id, title, url, folderId }) => {
        bookmarkService.update(id, { title, url, folderId });
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.BOOKMARKS_DELETE, (_event, { id }) => {
        bookmarkService.delete(id);
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.BOOKMARKS_FOLDER_CREATE, (_event, { name, parentId }) => {
        const profileId = profileService.getActive();
        return bookmarkService.createFolder(profileId, name, parentId);
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.BOOKMARKS_FOLDER_DELETE, (_event, { id }) => {
        bookmarkService.deleteFolder(id);
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.BOOKMARKS_REORDER, (_event, { id, newIndex, folderId }) => {
        bookmarkService.reorder(id, newIndex, folderId);
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.BOOKMARKS_EXPORT, () => {
        const profileId = profileService.getActive();
        return bookmarkService.exportNetscape(profileId);
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.BOOKMARKS_IMPORT, (_event, { html }) => {
        const profileId = profileService.getActive();
        const count = bookmarkService.importNetscape(profileId, html);
        return { count };
    });
}
