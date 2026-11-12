import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * Fetches SiteSettings once and applies the admin-configured favicon
 * plus the site CSS color variables to the document root.
 * Mounted at the app root so it runs on every route (including the
 * intro sequence, which has no Layout).
 */
export function useSiteBranding() {
  const { data: settings = [] } = useQuery({
    queryKey: ["siteSettings"],
    queryFn: () => base44.entities.SiteSettings.list(),
  });

  const siteSettings = settings[0];

  useEffect(() => {
    if (siteSettings?.favicon_url) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = siteSettings.favicon_url;
    }
    // Inject color CSS variables
    const root = document.documentElement;
    root.style.setProperty("--site-heading-color", siteSettings?.heading_color || "#ffffff");
    root.style.setProperty("--site-body-color", siteSettings?.body_text_color || "rgba(255,255,255,0.6)");
    root.style.setProperty("--site-nav-color", siteSettings?.nav_text_color || "rgba(255,255,255,0.5)");
    root.style.setProperty("--site-accent-color", siteSettings?.accent_text_color || "#a78bfa");
    root.style.setProperty("--site-card-color", siteSettings?.card_text_color || "#ffffff");
  }, [siteSettings]);

  return siteSettings;
}

export default useSiteBranding;