// src/App.js
import React from "react";
import { MsalProvider } from "@azure/msal-react";
import { pca } from "./auth/msalInstance";
import Content from "./components/Content";
import ErrorBoundary from "./components/ErrorBoundary";
//import S3LoggingDebug from "./components/S3LoggingDebug";

function App() {
  // MsalProvider handles initialization and redirects automatically
  return (
    <MsalProvider instance={pca}>
      <ErrorBoundary>
        <Content />
        {/*   <S3LoggingDebug>  */}
      </ErrorBoundary>
    </MsalProvider>
  );
}

export default App;
