import {
  buildRoomProgram
} from "./room-program.js";

import {
  calculateBuildableArea
} from "./buildable-area.js";


export function checkPlanFeasibility(requirements) {
  const country =
    String(
      requirements.country ||
      "india"
    ).toLowerCase();

  const roomProgram =
    buildRoomProgram(
      requirements
    );

  const areaInfo =
    calculateBuildableArea(
      requirements
    );

  const unit =
    String(
      requirements.plot?.unit ||
      areaInfo.plot?.unit ||
      "ft"
    ).toLowerCase();

  let minimumRoomArea = 0;
  let preferredRoomArea = 0;

  const roomBreakdown = [];

  for (
    const room
    of roomProgram
  ) {
    const minWidth =
      Number(
        room.minWidth || 0
      );

    const minHeight =
      Number(
        room.minHeight || 0
      );

    const preferredWidth =
      Number(
        room.preferredWidth ||
        room.minWidth ||
        0
      );

    const preferredHeight =
      Number(
        room.preferredHeight ||
        room.minHeight ||
        0
      );

    const minArea =
      minWidth *
      minHeight;

    const preferredArea =
      preferredWidth *
      preferredHeight;

    minimumRoomArea +=
      minArea;

    preferredRoomArea +=
      preferredArea;

    roomBreakdown.push({
      id:
        room.id,

      name:
        room.name,

      type:
        room.type,

      minimumArea:
        round(minArea),

      preferredArea:
        round(
          preferredArea
        )
    });
  }

  const circulationFactor =
    country === "germany"
      ? 0.14
      : 0.12;

  const wallFactor =
    country === "germany"
      ? 0.12
      : 0.10;

  const estimatedMinimumArea =
    minimumRoomArea *
    (
      1 +
      circulationFactor +
      wallFactor
    );

  const estimatedPreferredArea =
    preferredRoomArea *
    (
      1 +
      circulationFactor +
      wallFactor
    );

  const availableArea =
    areaInfo.buildable.area;

  let status;

  if (
    availableArea >=
    estimatedPreferredArea
  ) {
    status =
      "comfortable";
  } else if (
    availableArea >=
    estimatedMinimumArea
  ) {
    status =
      "tight";
  } else {
    status =
      "infeasible";
  }

  const warnings = [];

  if (
    status === "tight"
  ) {
    warnings.push(
      "The requested plan fits only with compact room dimensions."
    );
  }

  if (
    status === "infeasible"
  ) {
    warnings.push(
      "The requested room program does not fit inside the available buildable area."
    );
  }

  return {
    country,
    unit,
    status,

    buildableArea: {
      width:
        areaInfo.buildable.width,

      height:
        areaInfo.buildable.height,

      area:
        areaInfo.buildable.area
    },

    roomArea: {
      minimum:
        round(
          minimumRoomArea
        ),

      preferred:
        round(
          preferredRoomArea
        )
    },

    estimatedRequiredArea: {
      minimum:
        round(
          estimatedMinimumArea
        ),

      preferred:
        round(
          estimatedPreferredArea
        )
    },

    usage: {
      minimumPercent:
        round(
          (
            estimatedMinimumArea /
            availableArea
          ) *
          100
        ),

      preferredPercent:
        round(
          (
            estimatedPreferredArea /
            availableArea
          ) *
          100
        )
    },

    rooms:
      roomBreakdown,

    warnings
  };
}


export function validateGeneratedLayout(layout) {
  const rooms = Array.isArray(layout?.rooms) ? layout.rooms : [];
  const buildable = layout?.buildableArea;
  const tolerance = 0.05;
  const errors = [];

  const overlaps = [];
  rooms.forEach((room, index) => {
    for (const other of rooms.slice(index + 1)) {
      const overlapping = !(
        room.x + room.width <= other.x + tolerance ||
        other.x + other.width <= room.x + tolerance ||
        room.y + room.height <= other.y + tolerance ||
        other.y + other.height <= room.y + tolerance
      );
      if (overlapping) overlaps.push([room.id, other.id]);
    }
  });
  if (overlaps.length) errors.push("room-overlap");

  const outOfBounds = buildable ? rooms.filter(room =>
    room.x < buildable.x - tolerance ||
    room.y < buildable.y - tolerance ||
    room.x + room.width > buildable.x + buildable.width + tolerance ||
    room.y + room.height > buildable.y + buildable.height + tolerance
  ) : rooms;
  if (outOfBounds.length) errors.push("room-out-of-bounds");

  const belowMinimum = rooms.filter(room => {
    const minWidth = Number(room.minWidth || 0);
    const minHeight = Number(room.minHeight || 0);
    const normalOrientation = room.width + tolerance >= minWidth && room.height + tolerance >= minHeight;
    const rotatedOrientation = room.width + tolerance >= minHeight && room.height + tolerance >= minWidth;
    return !normalOrientation && !rotatedOrientation;
  });
  if (belowMinimum.length) errors.push("room-below-minimum");

  const attachedToiletErrors = rooms.filter(room => {
    if (room.type !== "attachedToilet") return false;
    const bedroom = rooms.find(candidate => candidate.id === room.attachedTo);
    return !bedroom || !rectanglesTouch(room, bedroom, tolerance);
  });
  if (attachedToiletErrors.length) errors.push("attached-toilet-disconnected");

  const exteriorBalconyErrors = rooms.filter(room => {
    if (!['balcony', 'deck'].includes(room.type) || !buildable) return false;
    return !(
      Math.abs(room.x - buildable.x) < tolerance ||
      Math.abs(room.y - buildable.y) < tolerance ||
      Math.abs(room.x + room.width - buildable.x - buildable.width) < tolerance ||
      Math.abs(room.y + room.height - buildable.y - buildable.height) < tolerance
    );
  });
  if (exteriorBalconyErrors.length) errors.push("balcony-not-exterior");

  const reportedArea = Number(layout?.areaSummary?.calculatedRoomArea);
  const calculatedArea = round(rooms.reduce((sum, room) => sum + room.width * room.height, 0));
  const areaConsistent = !Number.isFinite(reportedArea) || Math.abs(reportedArea - calculatedArea) < 0.2;
  if (!areaConsistent) errors.push("area-summary-inconsistent");

  return {
    valid: errors.length === 0,
    errors,
    overlaps,
    outOfBounds: outOfBounds.map(room => room.id),
    belowMinimum: belowMinimum.map(room => room.id),
    attachedToiletErrors: attachedToiletErrors.map(room => room.id),
    exteriorBalconyErrors: exteriorBalconyErrors.map(room => room.id),
    calculatedRoomArea: calculatedArea,
    areaConsistent
  };
}


function rectanglesTouch(first, second, tolerance) {
  const verticalOverlap = Math.min(first.y + first.height, second.y + second.height) - Math.max(first.y, second.y);
  const horizontalOverlap = Math.min(first.x + first.width, second.x + second.width) - Math.max(first.x, second.x);
  return (
    (Math.abs(first.x + first.width - second.x) < tolerance || Math.abs(second.x + second.width - first.x) < tolerance) && verticalOverlap > tolerance
  ) || (
    (Math.abs(first.y + first.height - second.y) < tolerance || Math.abs(second.y + second.height - first.y) < tolerance) && horizontalOverlap > tolerance
  );
}


function round(
  value,
  decimals = 2
) {
  const factor =
    10 ** decimals;

  return (
    Math.round(
      value *
      factor
    ) /
    factor
  );
}
