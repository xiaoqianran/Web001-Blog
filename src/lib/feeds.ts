import type { SiteConfig } from "./site";

/** RSS/Atom channel title: "Name — tagline" from site config. */
export function channelTitle(site: SiteConfig): string {
  return `${site.name} — ${site.tagline}`;
}
