import React from "react";
import Routes from "./Routes";
import { Toaster } from "react-hot-toast";
import { NotificationProvider } from "./NotificationContext";
function App() {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <NotificationProvider>
        <Routes />
      </NotificationProvider>
    </>
  );
}

export default App;
