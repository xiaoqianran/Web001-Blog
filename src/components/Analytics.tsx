import Script from "next/script";

/**
 * Optional privacy-friendly analytics.
 * Set NEXT_PUBLIC_PLAUSIBLE_DOMAIN to enable Plausible.
 */
export function Analytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim();
  if (!domain) return null;

  return (
    <Script
      defer
      data-domain={domain}
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  );
}
