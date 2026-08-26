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
