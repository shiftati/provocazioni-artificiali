import type { FC } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppStateProvider } from "./state/AppStateContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppShell } from "./components/layout/AppShell";
import { ConfigView } from "./features/config/ConfigView";
import { PresentationView } from "./features/presentation/PresentationView";
import { GameView } from "./features/game/GameView";
import { AnalyticsView } from "./features/analytics/AnalyticsView";
import { SessionReplayView } from "./features/replay/SessionReplayView";
import { SpeakerView } from "./features/speaker/SpeakerView";
import { ScriptView } from "./features/speaker/ScriptView";

export const App: FC = () => {
  return (
    <ErrorBoundary>
      <AppStateProvider>
        <HashRouter>
          <Routes>
            <Route path="/speaker" element={<SpeakerView />} />
            <Route path="/script" element={<ScriptView />} />
            <Route path="/replay/:sessionId?" element={<SessionReplayView />} />
            <Route
              path="*"
              element={
                <AppShell>
                  <Routes>
                    <Route path="/" element={<ConfigView />} />
                    <Route path="/slide" element={<PresentationView />} />
                    <Route path="/presentation" element={<PresentationView />} />
                    <Route path="/game" element={<GameView />} />
                    <Route path="/analytics" element={<AnalyticsView />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AppShell>
              }
            />
          </Routes>
        </HashRouter>
      </AppStateProvider>
    </ErrorBoundary>
  );
};
