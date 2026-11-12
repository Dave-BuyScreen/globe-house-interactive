// Hotel floor configuration for the Dashboard.
// Admins fully customize floors (tag, name, description, type) via the Floor Manager,
// persisted to SiteSettings.floors_config. Fonts, text styles, and colors stay locked in code.

export const DEFAULT_FLOORS = [
  { key: "trending", tag: "L", name: "Grand Lobby", blurb: "Featured highlights", type: "trending" },
  { key: "published", tag: "M", name: "The Mezzanine", blurb: "Now streaming", type: "published" },
  { key: "draft", tag: "A", name: "The Atrium", blurb: "In development", type: "draft" },
  { key: "red_rooster_jazz", tag: "J", name: "Jazz Parlour", blurb: "Red Rooster & Harlem Live Jazz", type: "red_rooster_jazz" },
  { key: "comedy_lounge", tag: "C", name: "Comedy Lounge", blurb: "Just comedy", type: "comedy_lounge" },
  { key: "documentaries", tag: "D", name: "Documentary Hall", blurb: "True stories", type: "documentaries" },
  { key: "tv_shows", tag: "T", name: "Theatre Suite", blurb: "Series & shows", type: "tv_shows" },
];

export const FLOOR_TYPES = [
  { value: "trending", label: "Trending (featured highlights)" },
  { value: "published", label: "Live / Published episodes" },
  { value: "draft", label: "In Development / Draft" },
  { value: "red_rooster_jazz", label: "Red Rooster & Harlem Live Jazz" },
  { value: "comedy_lounge", label: "Comedy Lounge" },
  { value: "documentaries", label: "Documentaries" },
  { value: "tv_shows", label: "TV Shows" },
  { value: "other", label: "Other" },
];

function withSelector(floor) {
  const key = floor.key;
  return {
    ...floor,
    // Floors are purely curated: an episode appears on a floor ONLY if its
    // assigned_floors array explicitly includes this floor's key. No automatic
    // category/status placement — every placement is a manual choice.
    select: (eps) =>
      (eps || []).filter(
        (e) => Array.isArray(e.assigned_floors) && e.assigned_floors.includes(key)
      ),
  };
}

export function resolveFloors(config, rowLabels) {
  if (Array.isArray(config) && config.length > 0) {
    return config.map((f, i) => withSelector({
      key: f.key || `floor_${i}`,
      tag: f.tag || String(i + 1),
      name: f.name || "Untitled Floor",
      blurb: f.blurb || "",
      type: f.type || "other",
    }));
  }
  return DEFAULT_FLOORS.map((f) => withSelector({
    ...f,
    name: rowLabels?.[f.key] || f.name,
  }));
}

export function floorName(floor) {
  return floor?.name || "Untitled Floor";
}