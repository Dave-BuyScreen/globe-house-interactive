/**
 * Zone Calculator - converts normalized coordinates to semantic zone labels
 */

export const ZONES_H = ["FL", "L", "ML", "M", "MR", "R", "FR"];
export const ZONES_V = ["HU", "U", "UC", "C", "BC", "B", "LB"];

export function getZoneH(x) {
  if (x < 0.14) return "FL";
  if (x < 0.28) return "L";
  if (x < 0.43) return "ML";
  if (x < 0.57) return "M";
  if (x < 0.71) return "MR";
  if (x < 0.86) return "R";
  return "FR";
}

export function getZoneV(y) {
  if (y < 0.14) return "HU";
  if (y < 0.28) return "U";
  if (y < 0.43) return "UC";
  if (y < 0.57) return "C";
  if (y < 0.71) return "BC";
  if (y < 0.86) return "B";
  return "LB";
}

export function getZonesFromBoundingBox(bbox) {
  const cx = bbox.x + bbox.width / 2;
  const cy = bbox.y + bbox.height / 2;
  return {
    zone_h: getZoneH(cx),
    zone_v: getZoneV(cy),
    anchor_point: { x: cx, y: cy }
  };
}

export function findNearestObject(tapX, tapY, objects, currentTime) {
  const active = objects.filter(
    (o) => currentTime >= o.start_time && currentTime <= o.end_time
  );
  if (!active.length) return null;

  let best = null;
  let bestScore = Infinity;

  active.forEach((obj) => {
    const ax = obj.anchor_point?.x ?? (obj.bounding_box?.x + obj.bounding_box?.width / 2);
    const ay = obj.anchor_point?.y ?? (obj.bounding_box?.y + obj.bounding_box?.height / 2);
    const dist = Math.hypot(tapX - ax, tapY - ay);

    // Check bounding box collision
    const bb = obj.bounding_box;
    const inside =
      tapX >= bb.x && tapX <= bb.x + bb.width &&
      tapY >= bb.y && tapY <= bb.y + bb.height;

    // Score: distance minus bonus for being inside box and z_index
    const score = dist - (inside ? 0.05 : 0) - (obj.z_index || 0) * 0.01;

    if (score < bestScore) {
      bestScore = score;
      best = obj;
    }
  });

  return best;
}