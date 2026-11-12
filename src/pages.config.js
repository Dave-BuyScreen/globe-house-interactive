import { lazy } from 'react';
import __Layout from './Layout.jsx';

// Lazy-loaded pages — each page is split into its own chunk and loaded
// on navigation, keeping the main bundle small for fast initial load.
const ARLandingPage = lazy(() => import('./pages/ARLandingPage'));
const Analytics = lazy(() => import('./pages/Analytics'));
const ChannelScheduler = lazy(() => import('./pages/ChannelScheduler'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const EmbedLive = lazy(() => import('./pages/EmbedLive'));
const EpisodeEditor = lazy(() => import('./pages/EpisodeEditor'));
const FoundersRegistry = lazy(() => import('./pages/FoundersRegistry'));
const LiveChannel = lazy(() => import('./pages/LiveChannel'));
const LiveTV = lazy(() => import('./pages/LiveTV'));
const Player = lazy(() => import('./pages/Player'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const Verify = lazy(() => import('./pages/Verify'));
const VerifyAdmin = lazy(() => import('./pages/VerifyAdmin'));
const Videos = lazy(() => import('./pages/Videos'));
const Wardrobe = lazy(() => import('./pages/Wardrobe'));
const Wishlist = lazy(() => import('./pages/Wishlist'));

export const PAGES = {
    "ARLandingPage": ARLandingPage,
    "Analytics": Analytics,
    "ChannelScheduler": ChannelScheduler,
    "Dashboard": Dashboard,
    "EmbedLive": EmbedLive,
    "EpisodeEditor": EpisodeEditor,
    "FoundersRegistry": FoundersRegistry,
    "LiveChannel": LiveChannel,
    "LiveTV": LiveTV,
    "Player": Player,
    "UserProfile": UserProfile,
    "Verify": Verify,
    "VerifyAdmin": VerifyAdmin,
    "Videos": Videos,
    "Wardrobe": Wardrobe,
    "Wishlist": Wishlist,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};