const MIN_DOOR_SPAN = 1.6;
const TOLERANCE = 0.05;

const PRIVATE_TYPES = new Set([
  "bedroom",
  "masterBedroom",
  "attachedToilet"
]);

const BATHROOM_TYPES = new Set([
  "attachedToilet",
  "commonToilet"
]);

const PUBLIC_TRANSIT_TYPES = new Set([
  "living",
  "dining",
  "familyLounge"
]);

export function sharedBoundary(a, b) {
  const yStart = Math.max(a.y, b.y);
  const yEnd = Math.min(a.y + a.height, b.y + b.height);
  const xStart = Math.max(a.x, b.x);
  const xEnd = Math.min(a.x + a.width, b.x + b.width);

  if (Math.abs(a.x + a.width - b.x) < TOLERANCE && yEnd - yStart >= MIN_DOOR_SPAN) {
    return { wall: "east", coord: a.x + a.width, center: (yStart + yEnd) / 2, length: yEnd - yStart };
  }
  if (Math.abs(b.x + b.width - a.x) < TOLERANCE && yEnd - yStart >= MIN_DOOR_SPAN) {
    return { wall: "west", coord: a.x, center: (yStart + yEnd) / 2, length: yEnd - yStart };
  }
  if (Math.abs(a.y + a.height - b.y) < TOLERANCE && xEnd - xStart >= MIN_DOOR_SPAN) {
    return { wall: "south", coord: a.y + a.height, center: (xStart + xEnd) / 2, length: xEnd - xStart };
  }
  if (Math.abs(b.y + b.height - a.y) < TOLERANCE && xEnd - xStart >= MIN_DOOR_SPAN) {
    return { wall: "north", coord: a.y, center: (xStart + xEnd) / 2, length: xEnd - xStart };
  }

  return null;
}

function accessBoundary(a, b) {
  const direct = sharedBoundary(a, b);
  if (direct) return direct;

  const corridor = a.isCirculation ? a : b.isCirculation ? b : null;
  const room = corridor === a ? b : a;
  if (!corridor?.overlay || room.isCirculation) return null;

  const xStart = Math.max(room.x, corridor.x);
  const xEnd = Math.min(room.x + room.width, corridor.x + corridor.width);
  const yStart = Math.max(room.y, corridor.y);
  const yEnd = Math.min(room.y + room.height, corridor.y + corridor.height);
  if (xEnd <= xStart || yEnd <= yStart) return null;

  if (corridor.height >= corridor.width && yEnd - yStart >= MIN_DOOR_SPAN) {
    const corridorIsRight = corridor.x + corridor.width / 2 >= room.x + room.width / 2;
    return {
      wall: corridorIsRight ? "east" : "west",
      coord: corridorIsRight ? corridor.x : corridor.x + corridor.width,
      center: (yStart + yEnd) / 2,
      length: yEnd - yStart
    };
  }

  if (xEnd - xStart >= MIN_DOOR_SPAN) {
    const corridorIsBelow = corridor.y + corridor.height / 2 >= room.y + room.height / 2;
    return {
      wall: corridorIsBelow ? "south" : "north",
      coord: corridorIsBelow ? corridor.y : corridor.y + corridor.height,
      center: (xStart + xEnd) / 2,
      length: xEnd - xStart
    };
  }

  return null;
}

function canEnterFrom(room, source) {
  if (room.type === "attachedToilet" || room.type === "utility") {
    return source.id === room.attachedTo;
  }

  if (room.type === "commonToilet") {
    return source.isCirculation || (!PRIVATE_TYPES.has(source.type) && !BATHROOM_TYPES.has(source.type));
  }

  if (PRIVATE_TYPES.has(room.type)) {
    return source.isCirculation || PUBLIC_TRANSIT_TYPES.has(source.type);
  }

  return source.isCirculation || PUBLIC_TRANSIT_TYPES.has(source.type);
}

export function buildAccessibilityReport(layout) {
  const rooms = Array.isArray(layout?.rooms) ? layout.rooms : [];
  const circulation = (Array.isArray(layout?.circulation) ? layout.circulation : [])
    .map(item => ({ ...item, isCirculation: true }));
  const entrances = Array.isArray(layout?.entrances) ? layout.entrances : [];
  const buildable = layout?.buildableArea;
  const validEntrances = entrances.filter(entrance => {
    const room = rooms.find(item => item.id === entrance.roomId);
    if (!room || !buildable) return false;
    const side = String(entrance.side || "").toLowerCase();
    if (side === "north") return Math.abs(room.y - buildable.y) < TOLERANCE;
    if (side === "south") return Math.abs(room.y + room.height - buildable.y - buildable.height) < TOLERANCE;
    if (side === "west") return Math.abs(room.x - buildable.x) < TOLERANCE;
    if (side === "east") return Math.abs(room.x + room.width - buildable.x - buildable.width) < TOLERANCE;
    return false;
  });
  const entranceRoomIds = new Set(validEntrances.map(item => item.roomId));
  const reachable = new Set(entranceRoomIds);
  const connections = [];
  const pending = [...rooms, ...circulation];

  let changed = true;
  while (changed) {
    changed = false;
    const sources = pending.filter(item => reachable.has(item.id));

    for (const target of pending) {
      if (reachable.has(target.id)) continue;

      const candidates = sources
        .map(source => ({ source, boundary: accessBoundary(target, source) }))
        .filter(candidate => candidate.boundary && (target.isCirculation || canEnterFrom(target, candidate.source)))
        .sort((a, b) => Number(b.source.isCirculation) - Number(a.source.isCirculation));

      if (!candidates.length) continue;
      const selected = candidates[0];
      reachable.add(target.id);
      connections.push({
        roomId: target.id,
        fromId: selected.source.id,
        fromCirculation: Boolean(selected.source.isCirculation),
        boundary: selected.boundary
      });
      changed = true;
    }
  }

  const inaccessibleRooms = rooms
    .filter(room => room.requiresCirculationAccess && !reachable.has(room.id))
    .map(room => ({ id: room.id, name: room.name, type: room.type }));
  const inaccessibleCommonToilets = rooms
    .filter(room => room.type === "commonToilet" && !reachable.has(room.id))
    .map(room => ({ id: room.id, name: room.name }));

  return {
    valid: entranceRoomIds.size > 0 && inaccessibleRooms.length === 0 && inaccessibleCommonToilets.length === 0,
    invalidEntranceIds: entrances.filter(item => !validEntrances.includes(item)).map(item => item.id),
    entranceRoomIds: [...entranceRoomIds],
    reachableRoomIds: rooms.filter(room => reachable.has(room.id)).map(room => room.id),
    inaccessibleRooms,
    inaccessibleCommonToilets,
    connections
  };
}
