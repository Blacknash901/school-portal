import React from "react";
import { useMsal } from "@azure/msal-react";
import MicrosoftSignInButton from "./MicrosoftSignInButton";
import GoogleSignInButton from "./GoogleSignInButton";
import logo from "../../assets/images/cecre_logo_test.jpeg";

export default function LoginButton() {
  const { instance } = useMsal();

  const handleGoogleSuccess = ({ profile }) => {
    console.log("Google profile:", profile);
  };

  const handleGoogleError = (err) => {
    console.error("Google sign-in error:", err);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        padding: 20,
        zIndex: 999,
      }}
    >
      <div
        style={{
          width: 380,
          maxWidth: "92%",
          background: "white",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
          textAlign: "center",
        }}
      >
        <img
          src={logo}
          alt="Centro Educativo Cristiano Reformado logo"
          style={{
            height: 84,
            width: 84,
            margin: "0 auto 12px",
            borderRadius: 12,
            objectFit: "cover",
            display: "block",
          }}
        />

        <div style={{ fontWeight: 700, marginBottom: 18 }}>
          Centro Educativo Cristiano Reformado
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <MicrosoftSignInButton style={{ width: "100%" }} />
          <GoogleSignInButton
            clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <a
            href="https://passwordreset.microsoftonline.com"
            target="_blank"
            rel="noreferrer"
            style={{ color: "#0078d4", fontSize: 13, textDecoration: "none" }}
          >
            Forgot your password?
          </a>
        </div>
      </div>
    </div>
  );
}
