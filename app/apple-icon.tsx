import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#A78BFA",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 92,
            fontWeight: 700,
            color: "#1a1025",
            fontFamily: "monospace",
            letterSpacing: -4,
          }}
        >
          {">_"}
        </div>
      </div>
    ),
    { ...size }
  );
}
