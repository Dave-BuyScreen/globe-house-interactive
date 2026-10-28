import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "./components/Layout";
import Dashboard from "./components/dashboard/Dashboard";
import Marketplace from "./components/marketplace/Marketplace";
import Player from "./components/player/Player";
import VideoMapper from "./components/mapping/VideoMapper";
import UBPLEditor from "./components/ubpl/UBPLEditor";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/player" element={<Player />} />
            <Route path="/mapper" element={<VideoMapper />} />
            <Route path="/ubpl-editor" element={<UBPLEditor />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
