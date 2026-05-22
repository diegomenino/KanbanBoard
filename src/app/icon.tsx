import { ImageResponse } from "next/og";

export const size = {
  width: 128,
  height: 128,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #7C6CFF 0%, #3347FF 100%)",
          borderRadius: "28px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "20px",
              height: "52px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.9)",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "21px",
                borderRadius: "999px",
                background: "#9E93FF",
              }}
            />
            <div
              style={{
                width: "28px",
                height: "21px",
                borderRadius: "999px",
                background: "#6EE7C8",
              }}
            />
          </div>
        </div>
      </div>
    ),
    size,
  );
}
