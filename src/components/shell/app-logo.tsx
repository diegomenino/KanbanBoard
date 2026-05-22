type AppLogoProps = {
  className?: string;
};

export function AppLogo({ className }: AppLogoProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="4" y="4" width="56" height="56" rx="18" fill="url(#logo-bg)" />
      <rect x="16" y="18" width="12" height="28" rx="6" fill="rgba(255,255,255,0.88)" />
      <rect x="32" y="18" width="16" height="12" rx="6" fill="#8B7BFF" />
      <rect x="32" y="34" width="16" height="12" rx="6" fill="#6EE7C8" />
      <defs>
        <linearGradient id="logo-bg" x1="10" y1="8" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7C6CFF" />
          <stop offset="1" stopColor="#3347FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}
