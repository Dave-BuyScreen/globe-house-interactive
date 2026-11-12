import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import SiteBranding from '@/components/SiteBranding';
import BrandedSplash from '@/components/BrandedSplash';

// Lazy-loaded pages — split into separate chunks, loaded on navigation
const TriggerAnalytics = lazy(() => import('./pages/TriggerAnalytics'));
const UBPLEditor = lazy(() => import('./pages/UBPLEditor'));
const EpisodePreview = lazy(() => import('./pages/EpisodePreview'));
const CollaborationInvites = lazy(() => import('./pages/CollaborationInvites'));
const Orders = lazy(() => import('./pages/Orders'));
const Virtual = lazy(() => import('./pages/Virtual'));
const ARPreview = lazy(() => import('./pages/ARPreview'));
const VideoMapper = lazy(() => import('./pages/VideoMapper'));
const MerchantApproval = lazy(() => import('./pages/MerchantApproval'));
const EngagementAnalytics = lazy(() => import('./pages/EngagementAnalytics'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const FloorAnalytics = lazy(() => import('./pages/FloorAnalytics'));
const Login = lazy(() => import('./pages/Login'));
const IntroSequence = lazy(() => import('@/components/intro/IntroSequence'));

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show branded splash while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return <BrandedSplash />;
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Suspense fallback={<BrandedSplash />}>
    <Routes>
      <Route path="/" element={<IntroSequence />} />
      <Route path="/login" element={<Login />} />
      <Route path="/Marketplace" element={
        <LayoutWrapper currentPageName="Marketplace">
          <Marketplace />
        </LayoutWrapper>
      } />
      <Route path="/Dashboard" element={
        <LayoutWrapper currentPageName="Dashboard">
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/TriggerAnalytics" element={
        <LayoutWrapper currentPageName="TriggerAnalytics">
          <TriggerAnalytics />
        </LayoutWrapper>
      } />
      <Route path="/EpisodePreview" element={<EpisodePreview />} />
      <Route path="/CollaborationInvites" element={
        <LayoutWrapper currentPageName="CollaborationInvites">
          <CollaborationInvites />
        </LayoutWrapper>
      } />
      <Route path="/Orders" element={
        <LayoutWrapper currentPageName="Orders">
          <Orders />
        </LayoutWrapper>
      } />
      <Route path="/ARPreview" element={<ARPreview />} />
      <Route path="/Virtual" element={
        <LayoutWrapper currentPageName="Virtual">
          <Virtual />
        </LayoutWrapper>
      } />
      <Route path="/UBPLEditor" element={
        <LayoutWrapper currentPageName="UBPLEditor">
          <UBPLEditor />
        </LayoutWrapper>
      } />
      <Route path="/VideoMapper" element={<VideoMapper />} />
      <Route path="/MerchantApproval" element={
        <LayoutWrapper currentPageName="MerchantApproval">
          <MerchantApproval />
        </LayoutWrapper>
      } />
      <Route path="/EngagementAnalytics" element={
        <LayoutWrapper currentPageName="EngagementAnalytics">
          <EngagementAnalytics />
        </LayoutWrapper>
      } />
      <Route path="/FloorAnalytics" element={
        <LayoutWrapper currentPageName="FloorAnalytics">
          <FloorAnalytics />
        </LayoutWrapper>
      } />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <SiteBranding />
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App