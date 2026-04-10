import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./app/App";
import { AppProviders } from "./app/Providers";
import "./styles.css";
import "@xyflow/react/dist/style.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>,
);
