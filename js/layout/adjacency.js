/*
  Resolves free-form chat adjacency requests ("place the common toilet near
  the hall, attached toilet 2 adjacent to it") into concrete room-id pairs
  that the layout engine can actually act on. Used as a universal
  post-placement pass so it works regardless of which internal strategy
  generated the geometry (rigid templates and the generic solver alike).

  Every attempt is reported back (applyAdjacencyPairs' return value) so the
  UI can tell the user honestly what was and wasn't actually applied,
  instead of silently doing nothing while the chat reply claims success.
*/

const RELATION_PATTERN = /\b(?:near|adjacent to|beside|next to|close to|connected to)\s+([a-z0-9 '\-]+)/gi;
const SWAP_PATTERN = /\bswap(?:ped)?(?:\s+with)?\s+([a-z0-9 '\-]+)/i;
const OPPOSITE_PATTERN = /\bopposite(?:\s+to)?\s+([a-z0-9 '\-]+)/i;
const SIDE_PATTERN = /\b(?:on|to|toward|towards)?\s*(left|right|top|bottom)\b/i;
const CIRCULATION_KEYWORDS = ["hall", "corridor", "passage", "lobby", "foyer", "landing"];

const CANONICAL_ROOM_IDS = {
  living: ["living"],
  familyLounge: ["family-lounge"],
  dining: ["dining"],
  kitchen: ["kitchen"],
  utility: ["utility"],
  masterBedroom: ["bedroom-1"],
  bedroom2: ["bedroom-2"],
  bedroom3: ["bedroom-3"],
  bedroom4: ["bedroom-4"],
  commonBathroom: ["common-toilet", "common-toilet-1"],
  masterBathroom: ["attached-toilet-1"],
  bathroom2: ["attached-toilet-2", "common-toilet-2"],
  bathroom3: ["attached-toilet-3", "common-toilet-3"],
  bathroom4: ["attached-toilet-4", "common-toilet-4"],
  foyer: ["entry-foyer"],
  passage: ["central-hall", "lobby-main", "lobby-rear", "bedroom-passage", "corridor-main"],
  balcony: ["balcony"],
  parking: ["parking"]
};

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function findRoomMatch(rooms, phrase) {
  const target = normalize(phrase);
  if (!target) return null;

  let best = null;
  let bestScore = 0;

  for (const room of rooms) {
    const candidates = [normalize(room.name), normalize(room.type), normalize(room.id.replace(/-/g, " "))];
    for (const candidate of candidates) {
      if (!candidate) continue;
      if (candidate === target) return room;
      if (target.includes(candidate) || candidate.includes(target)) {
        const score = Math.min(candidate.length, target.length);
        if (score > bestScore) {
          bestScore = score;
          best = room;
        }
      }
    }
  }

  return bestScore >= 3 ? best : null;
}

function findCirculationMatch(circulationRooms, phrase) {
  const target = normalize(phrase);
  if (!target) return null;
  if (!CIRCULATION_KEYWORDS.some(keyword => target.includes(keyword))) return null;

  return (circulationRooms || []).find(item => {
    const candidate = normalize(item.name || item.type || item.id || "");
    return CIRCULATION_KEYWORDS.some(keyword => candidate.includes(keyword)) || candidate.includes(target) || target.includes(candidate);
  }) || null;
}

/*
  Returns one entry per {room, preference} pair per "near/adjacent to X"
  phrase found inside it, whether or not it could actually be resolved --
  callers use `status` to tell requested-but-unresolved apart from resolved.
*/
export function resolveAdjacencyRequests(rooms, circulationRooms, roomPreferences) {
  const requests = [];
  if (!Array.isArray(roomPreferences)) return requests;

  for (const entry of roomPreferences) {
    const roomText = String(entry?.room || "").trim();
    const preferenceText = String(entry?.preference || "").trim();
    const source = findRoomMatch(rooms, roomText);

    if (!source) {
      requests.push({ roomText, preferenceText, phrase: null, status: "unresolved-source" });
      continue;
    }

    const swapMatch = preferenceText.match(SWAP_PATTERN);
    if (swapMatch) {
      const target = findRoomMatch(rooms.filter(room => room !== source), swapMatch[1]);
      requests.push(target
        ? { roomText, preferenceText, phrase: swapMatch[1], action: "swap", status: "resolved", source, target }
        : { roomText, preferenceText, phrase: swapMatch[1], action: "swap", status: "unresolved-target", source });
      continue;
    }

    const oppositeMatch = preferenceText.match(OPPOSITE_PATTERN);
    if (oppositeMatch) {
      const target = findRoomMatch(rooms.filter(room => room !== source), oppositeMatch[1]);
      requests.push(target
        ? { roomText, preferenceText, phrase: oppositeMatch[1], action: "opposite", status: "resolved", source, target }
        : { roomText, preferenceText, phrase: oppositeMatch[1], action: "opposite", status: "unresolved-target", source });
      continue;
    }

    const sideMatch = preferenceText.match(SIDE_PATTERN);
    if (sideMatch) {
      requests.push({ roomText, preferenceText, phrase: sideMatch[1], action: "side", side: sideMatch[1], status: "resolved", source });
      continue;
    }

    const phrases = [];
    let match;
    RELATION_PATTERN.lastIndex = 0;
    while ((match = RELATION_PATTERN.exec(preferenceText)) !== null) {
      phrases.push(match[1]);
    }

    if (!phrases.length) {
      requests.push({ roomText, preferenceText, phrase: null, status: "unresolved-target", source });
      continue;
    }

    for (const phrase of phrases) {
      const targetRoom = findRoomMatch(rooms.filter(r => r !== source), phrase);
      if (targetRoom) {
        requests.push({ roomText, preferenceText, phrase, status: "resolved", source, target: targetRoom });
        continue;
      }
      const targetCirculation = findCirculationMatch(circulationRooms, phrase);
      if (targetCirculation) {
        requests.push({ roomText, preferenceText, phrase, status: "resolved", source, target: targetCirculation });
        continue;
      }
      requests.push({ roomText, preferenceText, phrase, status: "unresolved-target", source });
    }
  }

  return requests;
}

function rectanglesTouch(a, b, tolerance = 0.05) {
  const horizontalTouch =
    (Math.abs(a.x + a.width - b.x) < tolerance || Math.abs(b.x + b.width - a.x) < tolerance) &&
    Math.min(a.y + a.height, b.y + b.height) > Math.max(a.y, b.y);

  const verticalTouch =
    (Math.abs(a.y + a.height - b.y) < tolerance || Math.abs(b.y + b.height - a.y) < tolerance) &&
    Math.min(a.x + a.width, b.x + b.width) > Math.max(a.x, b.x);

  return horizontalTouch || verticalTouch;
}

export function applyLayoutOperations(rooms, circulationRooms, operations, buildable) {
  if (!Array.isArray(operations)) return [];

  const operationKey = operation => [
    operation.operation, operation.source_room, operation.target_room,
    operation.donor_room, operation.side, operation.width, operation.depth,
    operation.area, operation.amount_sqft, operation.amount_percent,
    operation.requested_width, operation.requested_depth, operation.priority,
    operation.preserve_total_area, operation.preserve_room_usability
  ].join("|");
  const uniqueOperations = operations.filter((operation, index, all) =>
    index === all.findIndex(candidate => operationKey(candidate) === operationKey(operation))
  );

  return uniqueOperations.map(operation => {
    const source = findCanonicalRoom(rooms, circulationRooms, operation.source_room);
    const target = operation.target_room
      ? findCanonicalRoom(rooms, circulationRooms, operation.target_room)
      : null;
    const baseReport = {
      operation: operation.operation,
      source_room: operation.source_room,
      target_room: operation.target_room || null,
      side: operation.side || null
    };

    if (!source) {
      return { ...baseReport, status: "rejected", reason: `${canonicalLabel(operation.source_room)} is not present in the generated layout.` };
    }
    if (operation.target_room && !target) {
      return { ...baseReport, status: "rejected", reason: `${canonicalLabel(operation.target_room)} is not present in the generated layout.` };
    }
    if (operation.operation === "resize") {
      return { ...baseReport, status: "rejected", reason: "Resize is handled by room constraints, not positional operations." };
    }
    if (source.isCirculation || target?.isCirculation && operation.operation === "swap") {
      return { ...baseReport, status: "rejected", reason: "Circulation spaces cannot be swapped with rooms." };
    }

    if (operation.operation === "swap") {
      return executeSwap(rooms, source, target, buildable, baseReport);
    }
    if (operation.operation === "adjacent" || operation.operation === "near") {
      return executeProximity(rooms, source, target, buildable, baseReport);
    }
    if (operation.operation === "position") {
      return executePosition(rooms, source, operation.side, buildable, baseReport);
    }

    return { ...baseReport, status: "rejected", reason: "Unsupported layout operation." };
  });
}

function findCanonicalRoom(rooms, circulationRooms, canonicalId) {
  const ids = CANONICAL_ROOM_IDS[canonicalId] || [];
  const room = rooms.find(item => ids.includes(item.id));
  if (room) return room;
  const circulation = circulationRooms.find(item => ids.includes(item.id));
  return circulation ? { ...circulation, isCirculation: true } : null;
}

export function resolveCanonicalRoom(rooms, circulationRooms, canonicalId) {
  return findCanonicalRoom(rooms, circulationRooms, canonicalId);
}

function executeSwap(rooms, source, target, buildable, report) {
  if (!target) return { ...report, status: "rejected", reason: "A swap requires a target room." };
  const snapshot = rooms.map(room => ({ ...room }));
  const sourcePosition = { x: source.x, y: source.y };
  source.x = target.x;
  source.y = target.y;
  target.x = sourcePosition.x;
  target.y = sourcePosition.y;
  if (validRoomGeometry(rooms, buildable)) {
    source.operationLocked = true;
    target.operationLocked = true;
    return { ...report, status: "applied", reason: "Room positions swapped while preserving dimensions." };
  }

  restoreRooms(rooms, snapshot);
  const restoredSource = rooms.find(room => room.id === source.id);
  const restoredTarget = rooms.find(room => room.id === target.id);
  swapGeometry(restoredSource, restoredTarget);
  if (validRoomGeometry(rooms, buildable)) {
    restoredSource.operationLocked = true;
    restoredTarget.operationLocked = true;
    return { ...report, status: "approximated", reason: "Position boxes were exchanged because the original dimensions did not fit both locations." };
  }

  restoreRooms(rooms, snapshot);
  return { ...report, status: "rejected", reason: `${canonicalLabel(report.source_room)} dimensions do not fit the ${canonicalLabel(report.target_room)} location.` };
}

function executeProximity(rooms, source, target, buildable, report) {
  if (!target) return { ...report, status: "rejected", reason: "A proximity operation requires a target room." };
  if (rectanglesTouch(source, target)) {
    return { ...report, status: "applied", reason: "The requested rooms are already adjacent." };
  }

  const candidate = rooms.find(room =>
    room !== source && room !== target && rectanglesTouch(room, target)
  );
  if (!candidate) {
    return { ...report, status: "rejected", reason: `No valid room position is available near ${canonicalLabel(report.target_room)}.` };
  }

  const snapshot = rooms.map(room => ({ ...room }));
  const sourcePosition = { x: source.x, y: source.y };
  source.x = candidate.x;
  source.y = candidate.y;
  candidate.x = sourcePosition.x;
  candidate.y = sourcePosition.y;
  if (validRoomGeometry(rooms, buildable) && rectanglesTouch(source, target)) {
    source.operationLocked = true;
    candidate.operationLocked = true;
    return { ...report, status: operationStatus(report.operation), reason: "Moved to the nearest valid adjacent room position." };
  }

  restoreRooms(rooms, snapshot);
  return { ...report, status: "rejected", reason: `The requested room dimensions do not fit near ${canonicalLabel(report.target_room)}.` };
}

function executePosition(rooms, source, side, buildable, report) {
  if (!["left", "right", "top", "bottom"].includes(side)) {
    return { ...report, status: "rejected", reason: "A position operation requires left, right, top, or bottom." };
  }
  const horizontal = side === "left" || side === "right";
  const sourceCenter = horizontal
    ? source.x + source.width / 2
    : source.y + source.height / 2;
  const midpoint = horizontal
    ? buildable.x + buildable.width / 2
    : buildable.y + buildable.height / 2;
  const alreadyInRequestedHalf = side === "left" || side === "top"
    ? sourceCenter <= midpoint
    : sourceCenter >= midpoint;
  if (alreadyInRequestedHalf) {
    return { ...report, status: "applied", reason: `Room is already on the ${side} side.` };
  }

  const sorted = rooms.filter(room => room !== source).sort((first, second) => {
    const firstValue = horizontal ? first.x + first.width / 2 : first.y + first.height / 2;
    const secondValue = horizontal ? second.x + second.width / 2 : second.y + second.height / 2;
    return side === "left" || side === "top" ? firstValue - secondValue : secondValue - firstValue;
  });
  const candidate = sorted[0];
  if (!candidate) return { ...report, status: "rejected", reason: "No alternate room position is available." };

  const snapshot = rooms.map(room => ({ ...room }));
  const sourcePosition = { x: source.x, y: source.y };
  source.x = candidate.x;
  source.y = candidate.y;
  candidate.x = sourcePosition.x;
  candidate.y = sourcePosition.y;
  if (validRoomGeometry(rooms, buildable)) {
    source.operationLocked = true;
    candidate.operationLocked = true;
    return { ...report, status: "approximated", reason: `Moved toward the ${side} using the nearest valid room position.` };
  }
  restoreRooms(rooms, snapshot);
  return { ...report, status: "rejected", reason: `Room dimensions do not fit a valid ${side}-side position.` };
}

function operationStatus(operation) {
  return operation === "adjacent" ? "applied" : "approximated";
}

function validRoomGeometry(rooms, buildable) {
  const tolerance = 0.05;
  const inside = rooms.every(room =>
    room.x >= buildable.x - tolerance &&
    room.y >= buildable.y - tolerance &&
    room.x + room.width <= buildable.x + buildable.width + tolerance &&
    room.y + room.height <= buildable.y + buildable.height + tolerance
  );
  if (!inside) return false;
  return !rooms.some((room, index) => rooms.slice(index + 1).some(other =>
    room.x + room.width > other.x + tolerance &&
    other.x + other.width > room.x + tolerance &&
    room.y + room.height > other.y + tolerance &&
    other.y + other.height > room.y + tolerance
  ));
}

function restoreRooms(rooms, snapshot) {
  rooms.forEach((room, index) => Object.assign(room, snapshot[index]));
}

function canonicalLabel(canonicalId) {
  const labels = {
    familyLounge: "Family Lounge",
    masterBedroom: "Master Bedroom",
    bedroom2: "Bedroom 2",
    bedroom3: "Bedroom 3",
    bedroom4: "Bedroom 4",
    commonBathroom: "Common Bathroom",
    masterBathroom: "Master Bathroom"
  };
  return labels[canonicalId] || String(canonicalId || "room").replace(/([A-Z])/g, " $1").replace(/^./, value => value.toUpperCase());
}

/*
  Satisfies resolved adjacency requests by swapping a source room's
  geometry with whichever OTHER same-footprint room is already touching
  the target -- a same-size swap can never introduce overlaps or push
  rooms out of bounds, so this is safe to apply after any placement
  strategy. Returns a per-request report with a human-readable `status`:
    - "unresolved-source": couldn't match `room` to anything in the plan
    - "unresolved-target": couldn't match the "near X" phrase to anything
    - "already-satisfied": the rooms were already touching, nothing to do
    - "applied": geometry was changed to satisfy the request
    - "no-swap-candidate": both rooms were identified but no safe swap
       partner exists (e.g. mismatched room sizes) -- not applied
*/
export function applyAdjacencyPairs(rooms, circulationRooms, roomPreferences) {
  const requests = resolveAdjacencyRequests(rooms, circulationRooms, roomPreferences);

  for (const request of requests) {
    if (request.status !== "resolved") continue;
    const { source, target } = request;

    if (request.action === "swap") {
      swapGeometry(source, target);
      request.status = "applied";
      request.outcome = "applied";
      continue;
    }

    if (request.action === "side") {
      const bounds = rooms.reduce((result, room) => ({
        minX: Math.min(result.minX, room.x),
        maxX: Math.max(result.maxX, room.x + room.width),
        minY: Math.min(result.minY, room.y),
        maxY: Math.max(result.maxY, room.y + room.height)
      }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
      const horizontal = request.side === "left" || request.side === "right";
      const candidates = rooms.filter(room => room !== source).sort((a, b) => {
        const aValue = horizontal ? a.x + a.width / 2 : a.y + a.height / 2;
        const bValue = horizontal ? b.x + b.width / 2 : b.y + b.height / 2;
        return request.side === "left" || request.side === "top" ? aValue - bValue : bValue - aValue;
      });
      const midpoint = horizontal ? (bounds.minX + bounds.maxX) / 2 : (bounds.minY + bounds.maxY) / 2;
      const sourceValue = horizontal ? source.x + source.width / 2 : source.y + source.height / 2;
      const already = request.side === "left" || request.side === "top" ? sourceValue <= midpoint : sourceValue >= midpoint;
      if (already) {
        request.status = "already-satisfied";
        request.outcome = "applied";
      } else if (candidates.length) {
        swapGeometry(source, candidates[0]);
        request.target = candidates[0];
        request.status = "applied";
        request.outcome = "approximated";
      } else {
        request.status = "no-swap-candidate";
        request.outcome = "not-feasible";
      }
      continue;
    }

    if (request.action === "opposite") {
      const targetCenterX = target.x + target.width / 2;
      const targetCenterY = target.y + target.height / 2;
      const candidate = rooms
        .filter(room => room !== source && room !== target)
        .sort((a, b) => {
          const distance = room => Math.hypot(room.x + room.width / 2 - targetCenterX, room.y + room.height / 2 - targetCenterY);
          return distance(b) - distance(a);
        })[0];
      if (candidate) {
        swapGeometry(source, candidate);
        request.status = "applied";
        request.outcome = "approximated";
      } else {
        request.status = "no-swap-candidate";
        request.outcome = "not-feasible";
      }
      continue;
    }

    if (rectanglesTouch(source, target)) {
      request.status = "already-satisfied";
      request.outcome = "applied";
      continue;
    }

    const swapPartner = rooms.find(room =>
      room !== source &&
      room.id !== target.id &&
      rectanglesTouch(room, target) &&
      Math.abs(room.width - source.width) <= Math.max(1.5, source.width * 0.2) &&
      Math.abs(room.height - source.height) <= Math.max(1.5, source.height * 0.2)
    );

    if (!swapPartner) {
      request.status = "no-swap-candidate";
      request.outcome = "not-feasible";
      continue;
    }

    swapGeometry(source, swapPartner);
    request.status = "applied";
    request.outcome = "applied";
  }

  return requests.map(r => ({
    roomText: r.roomText,
    preferenceText: r.preferenceText,
    phrase: r.phrase,
    status: r.status,
    outcome: r.outcome || (r.status.startsWith("unresolved") ? "not-feasible" : null),
    action: r.action || "adjacent",
    sourceLabel: r.source?.name || r.roomText,
    targetLabel: r.target?.name || r.phrase || null
  }));
}

function swapGeometry(first, second) {
  const snapshot = { x: first.x, y: first.y, width: first.width, height: first.height, area: first.area };
  first.x = second.x;
  first.y = second.y;
  first.width = second.width;
  first.height = second.height;
  first.area = second.area;
  second.x = snapshot.x;
  second.y = snapshot.y;
  second.width = snapshot.width;
  second.height = snapshot.height;
  second.area = snapshot.area;
}
