import { ImageResponse } from "next/og";

export const alt = "Covenant - Living Intelligence for SaaS Codebases";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 80,
          background: "linear-gradient(135deg,#fbfaf6 0%,#eef1ee 60%,#d6e7e3 100%)",
          fontFamily: "system-ui"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              background: "linear-gradient(135deg,#0b6e6e,#0a3d62)",
              borderRadius: 12,
              color: "#fbfaf6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: 800
            }}
          >
            C
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, color: "#0a1620" }}>Covenant</div>
        </div>
        <div style={{ marginTop: 80, display: "flex", fontSize: 84, fontWeight: 800, color: "#0a1620", lineHeight: 1.05, letterSpacing: -2 }}>
          Living intelligence for SaaS codebases.
        </div>
        <div style={{ marginTop: 32, display: "flex", fontSize: 30, color: "#3d4a55", lineHeight: 1.35, maxWidth: 980 }}>
          20 always-on agents that document, secure, audit, and enforce your codebase on every commit.
        </div>
        <div style={{ marginTop: "auto", display: "flex", gap: 24, fontSize: 22, color: "#0b6e6e", fontWeight: 700 }}>
          <span>covenant.dev</span>
          <span>·</span>
          <span>20 agents</span>
          <span>·</span>
          <span>Living semantic graph</span>
        </div>
      </div>
    ),
    size
  );
}
