"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingCancelPullSchema = exports.OnboardingPullModelSchema = exports.FindStopSchema = exports.FindStartSchema = exports.ProfileUpdateSchema = exports.ProfileDeleteSchema = exports.ProfileCreateSchema = exports.ProfileSwitchSchema = exports.SettingsSetSchema = exports.SettingsGetSchema = exports.AiSummarizePageSchema = exports.AiAbortSchema = exports.AiMessagesGetSchema = exports.AiConversationDeleteSchema = exports.AiConversationCreateSchema = exports.AiSendSchema = exports.BookmarkUpdateSchema = exports.BookmarkAddSchema = exports.HistoryClearRangeSchema = exports.HistoryDeleteSchema = exports.HistoryAddSchema = exports.HistorySearchSchema = exports.NavDevtoolsSchema = exports.NavZoomSchema = exports.NavStopSchema = exports.NavReloadSchema = exports.NavGoForwardSchema = exports.NavGoBackSchema = exports.NavLoadUrlSchema = exports.TabActivateSchema = exports.TabCloseSchema = exports.TabCreateSchema = void 0;
const zod_1 = require("zod");
exports.TabCreateSchema = zod_1.z.object({
    url: zod_1.z.string().optional(),
    title: zod_1.z.string().optional(),
    isPinned: zod_1.z.boolean().optional(),
    groupId: zod_1.z.string().nullable().optional(),
    splitId: zod_1.z.string().nullable().optional(),
    profileId: zod_1.z.string().optional(),
}).strict();
exports.TabCloseSchema = zod_1.z.object({ tabId: zod_1.z.string().uuid() }).strict();
exports.TabActivateSchema = zod_1.z.object({ tabId: zod_1.z.string().uuid() }).strict();
exports.NavLoadUrlSchema = zod_1.z.object({
    tabId: zod_1.z.string().uuid(),
    url: zod_1.z.string().min(1).max(8192),
}).strict();
exports.NavGoBackSchema = zod_1.z.object({ tabId: zod_1.z.string().uuid() }).strict();
exports.NavGoForwardSchema = zod_1.z.object({ tabId: zod_1.z.string().uuid() }).strict();
exports.NavReloadSchema = zod_1.z.object({
    tabId: zod_1.z.string().uuid(),
    ignoreCache: zod_1.z.boolean().optional(),
}).strict();
exports.NavStopSchema = zod_1.z.object({ tabId: zod_1.z.string().uuid() }).strict();
exports.NavZoomSchema = zod_1.z.object({
    tabId: zod_1.z.string().uuid(),
    factor: zod_1.z.number().min(0.1).max(5),
}).strict();
exports.NavDevtoolsSchema = zod_1.z.object({ tabId: zod_1.z.string().uuid() }).strict();
exports.HistorySearchSchema = zod_1.z.object({
    query: zod_1.z.string().max(512),
    limit: zod_1.z.number().int().min(1).max(500).optional(),
    offset: zod_1.z.number().int().min(0).optional(),
}).strict();
exports.HistoryAddSchema = zod_1.z.object({
    url: zod_1.z.string().url().max(8192),
    title: zod_1.z.string().max(2048),
    favicon: zod_1.z.string().optional(),
}).strict();
exports.HistoryDeleteSchema = zod_1.z.object({ id: zod_1.z.number().int() }).strict();
exports.HistoryClearRangeSchema = zod_1.z.object({
    from: zod_1.z.number().int(),
    to: zod_1.z.number().int(),
}).strict();
exports.BookmarkAddSchema = zod_1.z.object({
    url: zod_1.z.string().url().max(8192),
    title: zod_1.z.string().max(2048),
    folderId: zod_1.z.number().int().optional(),
    favicon: zod_1.z.string().optional(),
}).strict();
exports.BookmarkUpdateSchema = zod_1.z.object({
    id: zod_1.z.number().int(),
    title: zod_1.z.string().max(2048).optional(),
    url: zod_1.z.string().url().max(8192).optional(),
    folderId: zod_1.z.number().int().nullable().optional(),
}).strict();
exports.AiSendSchema = zod_1.z.object({
    conversationId: zod_1.z.string().uuid(),
    content: zod_1.z.string().min(1).max(100_000),
    model: zod_1.z.string().min(1).max(256),
}).strict();
exports.AiConversationCreateSchema = zod_1.z.object({
    model: zod_1.z.string().min(1).max(256),
    systemPrompt: zod_1.z.string().max(10_000).optional(),
}).strict();
exports.AiConversationDeleteSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
}).strict();
exports.AiMessagesGetSchema = zod_1.z.object({
    conversationId: zod_1.z.string().uuid(),
}).strict();
exports.AiAbortSchema = zod_1.z.object({
    conversationId: zod_1.z.string().uuid(),
}).strict();
exports.AiSummarizePageSchema = zod_1.z.object({
    conversationId: zod_1.z.string().uuid(),
    pageText: zod_1.z.string().max(200_000),
    model: zod_1.z.string().min(1).max(256),
}).strict();
exports.SettingsGetSchema = zod_1.z.object({
    profileId: zod_1.z.string().min(1).max(256),
}).strict();
exports.SettingsSetSchema = zod_1.z.object({
    profileId: zod_1.z.string().min(1).max(256),
    settings: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()),
}).strict();
exports.ProfileSwitchSchema = zod_1.z.object({
    id: zod_1.z.string().min(1).max(256),
}).strict();
exports.ProfileCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(128),
    avatar: zod_1.z.string().optional(),
}).strict();
exports.ProfileDeleteSchema = zod_1.z.object({
    id: zod_1.z.string().min(1).max(256),
}).strict();
exports.ProfileUpdateSchema = zod_1.z.object({
    id: zod_1.z.string().min(1).max(256),
    name: zod_1.z.string().min(1).max(128).optional(),
    avatar: zod_1.z.string().optional(),
}).strict();
exports.FindStartSchema = zod_1.z.object({
    tabId: zod_1.z.string().uuid(),
    text: zod_1.z.string().min(1).max(1024),
    forward: zod_1.z.boolean().optional(),
}).strict();
exports.FindStopSchema = zod_1.z.object({
    tabId: zod_1.z.string().uuid(),
}).strict();
exports.OnboardingPullModelSchema = zod_1.z.object({
    model: zod_1.z.string().min(1).max(256),
}).strict();
exports.OnboardingCancelPullSchema = zod_1.z.object({
    model: zod_1.z.string().min(1).max(256),
}).strict();
