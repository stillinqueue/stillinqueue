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


/*
  Still In Queue · Accessibility V17
  ----------------------------------
  Accessibility is evaluated against the room's ACTUAL orthogonal geometry.

  A room may be:
  - one legacy rectangle
  - an L-shaped / stepped room composed from architecturalShape.parts

  Circulation objects remain rectangular.

  The report is valid only when:
  - at least one real entrance reaches a room on the exterior edge
  - every room requiring circulation access is reachable
  - common toilets are independently reachable
*/


function geometryParts(item) {
  if (!item) return [];

  /*
    Circulation remains one rectangle even if some future caller happens to
    attach architecturalShape metadata to it.
  */
  if (item.isCirculation) {
    return [{
      x: Number(item.x || 0),
      y: Number(item.y || 0),
      width: Number(item.width || 0),
      height: Number(item.height || 0)
    }];
  }

  const explicit = item?.architecturalShape?.parts;

  if (Array.isArray(explicit) && explicit.length > 1) {
    const parts = explicit
      .map(part => ({
        x: Number(part.x),
        y: Number(part.y),
        width: Number(part.width),
        height: Number(part.height)
      }))
      .filter(part =>
        Number.isFinite(part.x) &&
        Number.isFinite(part.y) &&
        part.width > 0 &&
        part.height > 0
      );

    if (parts.length) return parts;
  }

  return [{
    x: Number(item.x || 0),
    y: Number(item.y || 0),
    width: Number(item.width || 0),
    height: Number(item.height || 0)
  }];
}


function partSharedBoundary(a, b) {
  const yStart = Math.max(a.y, b.y);
  const yEnd = Math.min(a.y + a.height, b.y + b.height);
  const xStart = Math.max(a.x, b.x);
  const xEnd = Math.min(a.x + a.width, b.x + b.width);

  if (
    Math.abs(a.x + a.width - b.x) < TOLERANCE &&
    yEnd - yStart >= MIN_DOOR_SPAN
  ) {
    return {
      wall: "east",
      coord: a.x + a.width,
      center: (yStart + yEnd) / 2,
      length: yEnd - yStart
    };
  }

  if (
    Math.abs(b.x + b.width - a.x) < TOLERANCE &&
    yEnd - yStart >= MIN_DOOR_SPAN
  ) {
    return {
      wall: "west",
      coord: a.x,
      center: (yStart + yEnd) / 2,
      length: yEnd - yStart
    };
  }

  if (
    Math.abs(a.y + a.height - b.y) < TOLERANCE &&
    xEnd - xStart >= MIN_DOOR_SPAN
  ) {
    return {
      wall: "south",
      coord: a.y + a.height,
      center: (xStart + xEnd) / 2,
      length: xEnd - xStart
    };
  }

  if (
    Math.abs(b.y + b.height - a.y) < TOLERANCE &&
    xEnd - xStart >= MIN_DOOR_SPAN
  ) {
    return {
      wall: "north",
      coord: a.y,
      center: (xStart + xEnd) / 2,
      length: xEnd - xStart
    };
  }

  return null;
}


export function sharedBoundary(a, b) {
  const firstParts = geometryParts(a);
  const secondParts = geometryParts(b);

  let best = null;

  for (const first of firstParts) {
    for (const second of secondParts) {
      const boundary = partSharedBoundary(first, second);
      if (!boundary) continue;

      /*
        Prefer the longest usable shared edge. This gives door generation the
        most practical wall when an L-shaped room touches the same neighbor on
        more than one segment.
      */
      if (!best || boundary.length > best.length) {
        best = boundary;
      }
    }
  }

  return best;
}


function partOverlapBoundary(roomPart, corridorPart, corridor) {
  const xStart = Math.max(roomPart.x, corridorPart.x);
  const xEnd = Math.min(roomPart.x + roomPart.width, corridorPart.x + corridorPart.width);
  const yStart = Math.max(roomPart.y, corridorPart.y);
  const yEnd = Math.min(roomPart.y + roomPart.height, corridorPart.y + corridorPart.height);

  if (xEnd <= xStart || yEnd <= yStart) return null;

  if (
    corridor.height >= corridor.width &&
    yEnd - yStart >= MIN_DOOR_SPAN
  ) {
    const corridorIsRight =
      corridorPart.x + corridorPart.width / 2 >=
      roomPart.x + roomPart.width / 2;

    return {
      wall: corridorIsRight ? "east" : "west",
      coord: corridorIsRight
        ? corridorPart.x
        : corridorPart.x + corridorPart.width,
      center: (yStart + yEnd) / 2,
      length: yEnd - yStart
    };
  }

  if (
    xEnd - xStart >= MIN_DOOR_SPAN
  ) {
    const corridorIsBelow =
      corridorPart.y + corridorPart.height / 2 >=
      roomPart.y + roomPart.height / 2;

    return {
      wall: corridorIsBelow ? "south" : "north",
      coord: corridorIsBelow
        ? corridorPart.y
        : corridorPart.y + corridorPart.height,
      center: (xStart + xEnd) / 2,
      length: xEnd - xStart
    };
  }

  return null;
}


function accessBoundary(a, b) {
  const direct = sharedBoundary(a, b);
  if (direct) return direct;

  const corridor =
    a.isCirculation
      ? a
      : b.isCirculation
        ? b
        : null;

  const room =
    corridor === a
      ? b
      : a;

  if (
    !corridor?.overlay ||
    room.isCirculation
  ) {
    return null;
  }

  let best = null;

  for (const roomPart of geometryParts(room)) {
    for (const corridorPart of geometryParts(corridor)) {
      const boundary =
        partOverlapBoundary(
          roomPart,
          corridorPart,
          corridor
        );

      if (!boundary) continue;

      if (
        !best ||
        boundary.length >
        best.length
      ) {
        best = boundary;
      }
    }
  }

  return best;
}


function canEnterFrom(room, source) {
  if (
    room.type === "attachedToilet" ||
    room.type === "utility"
  ) {
    return (
      source.id ===
      room.attachedTo
    );
  }

  if (
    room.type === "commonToilet"
  ) {
    return (
      source.isCirculation ||
      (
        !PRIVATE_TYPES.has(
          source.type
        ) &&
        !BATHROOM_TYPES.has(
          source.type
        )
      )
    );
  }

  if (
    PRIVATE_TYPES.has(
      room.type
    )
  ) {
    return (
      source.isCirculation ||
      PUBLIC_TRANSIT_TYPES.has(
        source.type
      )
    );
  }

  return (
    source.isCirculation ||
    PUBLIC_TRANSIT_TYPES.has(
      source.type
    )
  );
}


function roomTouchesBuildableSide(
  room,
  buildable,
  side
) {
  return geometryParts(room)
    .some(part => {
      if (
        side === "north"
      ) {
        return (
          Math.abs(
            part.y -
            buildable.y
          ) <
          TOLERANCE
        );
      }

      if (
        side === "south"
      ) {
        return (
          Math.abs(
            part.y +
            part.height -
            buildable.y -
            buildable.height
          ) <
          TOLERANCE
        );
      }

      if (
        side === "west"
      ) {
        return (
          Math.abs(
            part.x -
            buildable.x
          ) <
          TOLERANCE
        );
      }

      if (
        side === "east"
      ) {
        return (
          Math.abs(
            part.x +
            part.width -
            buildable.x -
            buildable.width
          ) <
          TOLERANCE
        );
      }

      return false;
    });
}


function validEntranceForRoom(
  entrance,
  room,
  buildable
) {
  if (
    !room ||
    !buildable
  ) {
    return false;
  }

  const side =
    String(
      entrance.side ||
      ""
    ).toLowerCase();

  return roomTouchesBuildableSide(
    room,
    buildable,
    side
  );
}


export function buildAccessibilityReport(layout) {
  const rooms =
    Array.isArray(
      layout?.rooms
    )
      ? layout.rooms
      : [];

  const circulation =
    (
      Array.isArray(
        layout?.circulation
      )
        ? layout.circulation
        : []
    ).map(item => ({
      ...item,
      isCirculation: true
    }));

  const entrances =
    Array.isArray(
      layout?.entrances
    )
      ? layout.entrances
      : [];

  const buildable =
    layout?.buildableArea;

  const validEntrances =
    entrances.filter(
      entrance => {
        const room =
          rooms.find(
            item =>
              item.id ===
              entrance.roomId
          );

        return validEntranceForRoom(
          entrance,
          room,
          buildable
        );
      }
    );

  const entranceRoomIds =
    new Set(
      validEntrances.map(
        item =>
          item.roomId
      )
    );

  const reachable =
    new Set(
      entranceRoomIds
    );

  const connections =
    [];

  const pending = [
    ...rooms,
    ...circulation
  ];

  let changed = true;

  while (changed) {
    changed = false;

    const sources =
      pending.filter(
        item =>
          reachable.has(
            item.id
          )
      );

    for (
      const target
      of pending
    ) {
      if (
        reachable.has(
          target.id
        )
      ) {
        continue;
      }

      const candidates =
        sources
          .map(source => ({
            source,
            boundary:
              accessBoundary(
                target,
                source
              )
          }))
          .filter(candidate =>
            candidate.boundary &&
            (
              target.isCirculation ||
              canEnterFrom(
                target,
                candidate.source
              )
            )
          )
          .sort(
            (
              a,
              b
            ) => {
              /*
                Prefer circulation access first, then the longer practical
                boundary. This helps avoid routing a bedroom through another
                room when a clean hall connection exists.
              */
              const circulationPriority =
                Number(
                  b.source
                    .isCirculation
                ) -
                Number(
                  a.source
                    .isCirculation
                );

              if (
                circulationPriority !==
                0
              ) {
                return circulationPriority;
              }

              return (
                Number(
                  b.boundary
                    ?.length ||
                    0
                ) -
                Number(
                  a.boundary
                    ?.length ||
                    0
                )
              );
            }
          );

      if (
        !candidates.length
      ) {
        continue;
      }

      const selected =
        candidates[0];

      reachable.add(
        target.id
      );

      connections.push({
        roomId:
          target.id,

        fromId:
          selected.source.id,

        fromCirculation:
          Boolean(
            selected.source
              .isCirculation
          ),

        boundary:
          selected.boundary
      });

      changed =
        true;
    }
  }


  const inaccessibleRooms =
    rooms
      .filter(room =>
        room.requiresCirculationAccess &&
        !reachable.has(
          room.id
        )
      )
      .map(room => ({
        id:
          room.id,
        name:
          room.name,
        type:
          room.type
      }));

  const inaccessibleCommonToilets =
    rooms
      .filter(room =>
        room.type ===
          "commonToilet" &&
        !reachable.has(
          room.id
        )
      )
      .map(room => ({
        id:
          room.id,
        name:
          room.name
      }));


  /*
    Useful diagnostics for the chat/planner. These make a future failure
    explainable without another vague "geometry failed" message.
  */
  const unreachableCirculationIds =
    circulation
      .filter(item =>
        !reachable.has(
          item.id
        )
      )
      .map(
        item =>
          item.id
      );

  return {
    valid:
      entranceRoomIds.size >
        0 &&
      inaccessibleRooms.length ===
        0 &&
      inaccessibleCommonToilets.length ===
        0,

    geometryModel: {
      version:
        "orthogonal-v1",
      compoundRoomIds:
        rooms
          .filter(
            room =>
              geometryParts(
                room
              ).length >
              1
          )
          .map(
            room =>
              room.id
          )
    },

    invalidEntranceIds:
      entrances
        .filter(
          item =>
            !validEntrances.includes(
              item
            )
        )
        .map(
          item =>
            item.id
        ),

    entranceRoomIds:
      [
        ...entranceRoomIds
      ],

    reachableRoomIds:
      rooms
        .filter(
          room =>
            reachable.has(
              room.id
            )
        )
        .map(
          room =>
            room.id
        ),

    inaccessibleRooms,

    inaccessibleCommonToilets,

    unreachableCirculationIds,

    connections
  };
}
