import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "../components/AppShell";

const BoardPage = lazy(async () => ({ default: (await import("../pages/BoardPage")).BoardPage }));
const CardsPage = lazy(async () => ({ default: (await import("../pages/CardsPage")).CardsPage }));
const InspectorPage = lazy(async () => ({ default: (await import("../pages/InspectorPage")).InspectorPage }));
const PromptReforgerPage = lazy(async () => ({
  default: (await import("../pages/PromptReforgerPage")).PromptReforgerPage,
}));
const RunsPage = lazy(async () => ({ default: (await import("../pages/RunsPage")).RunsPage }));
const SequencerPage = lazy(async () => ({ default: (await import("../pages/SequencerPage")).SequencerPage }));

export function AppRoutes() {
  return (
    <Suspense fallback={<div className="route-loading">Loading surface...</div>}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate replace to="/cards" />} />
          <Route path="/cards" element={<CardsPage />} />
          <Route path="/cards/:cardId" element={<CardsPage />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="/runs" element={<RunsPage />} />
          <Route path="/runs/:sessionId" element={<RunsPage />} />
          <Route path="/inspector" element={<InspectorPage />} />
          <Route path="/inspector/:kind/:id" element={<InspectorPage />} />
          <Route path="/sequencer" element={<SequencerPage />} />
          <Route path="/prompt-reforger" element={<PromptReforgerPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
