import React from "react";
import Routes from "./Routes";
import { Toaster } from "react-hot-toast";
import { NotificationProvider } from "./NotificationContext";
import { ThemeProvider } from "./ThemeContext";
import StepUpDialog from "./components/StepUpDialog";

/**
 * The toaster renders OUTSIDE the page tree, so its own surface has to be
 * told about the theme. Pointing it at the tokens means one definition
 * serves both -- it is otherwise a white card that survives the flip.
 */
const toastOptions = {
  style: {
    background: "rgb(var(--color-card-rgb))",
    color: "rgb(var(--color-foreground-rgb))",
    border: "1px solid rgb(var(--color-border-rgb))",
  },
};

function App() {
  return (
    <ThemeProvider>
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={toastOptions}
      />
      {/* Mounted ONCE and deliberately OUTSIDE <Routes>: a step-up dialog
          inside a route unmounts on navigation and leaves the export that
          opened it awaiting a promise that can never settle. */}
      <StepUpDialog />
      <NotificationProvider>
        <Routes />
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
