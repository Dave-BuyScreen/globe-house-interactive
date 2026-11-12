import { useSiteBranding } from "@/hooks/useSiteBranding";

/**
 * Mounts the site-branding hook at the app root so the favicon and
 * theme variables are applied on every route. Renders nothing.
 */
export default function SiteBranding() {
  useSiteBranding();
  return null;
}