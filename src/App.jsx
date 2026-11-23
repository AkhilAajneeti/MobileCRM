import React from "react";
import Routes from "./Routes";
import { Toaster } from "react-hot-toast";
import { NotificationProvider } from "./NotificationContext";
import { ThemeProvider } from "./ThemeContext";

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
      <NotificationProvider>
        <Routes />
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
