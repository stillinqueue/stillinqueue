import {
  getDesignProfile
} from "./plan-schema.js";

import {
  buildRoomProgram
} from "./room-program.js";

import {
  calculateBuildableArea
} from "./buildable-area.js";


export function checkPlanFeasibility(requirements) {
  const country = String(
    requirements.country || "india"
  ).toLowerCase();

  const profile = getDesignProfile(country);

  const roomProgram =
    buildRoomProgram(requirements);

  const areaInfo =
    calculateBuildableArea(requirements);

  const unit = profile.unit;

  /*
    ---------------------------------------------------------
    1. CALCULATE MINIMUM ROOM AREA
    ---------------------------------------------------------
  */

  let minimumRoomArea = 0;
  let preferredRoomArea = 0;

  const roomBreakdown = [];

  for (const room of roomProgram) {
    const minWidth =
      Number(room.minWidth || 0);

    const minHeight =
      Number(room.minHeight || 0);

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
      minWidth * minHeight;

    const preferredArea =
      preferredWidth * preferredHeight;

    minimumRoomArea += minArea;
    preferredRoomArea += preferredArea;

    roomBreakdown.push({
      id: room.id,
      name: room.name,
      type: room.type,

      minimumArea:
        round(minArea),

      preferredArea:
        round(preferredArea)
    });
  }


  /*
    ---------------------------------------------------------
    2. ADD CIRCULATION ALLOWANCE

    The room areas alone are not enough.

    We also need space for:
    - corridors
    - door approach
    - internal movement
    - small transition areas

    India and Germany use slightly different assumptions.
    ---------------------------------------------------------
  */

  const circulationFactor =
    country === "germany"
      ? 0.14
      : 0.12;

  const minimumCirculationArea =
    minimumRoomArea * circulationFactor;

  const preferredCirculationArea =
    preferredRoomArea * circulationFactor;


  /*
    ---------------------------------------------------------
    3. ADD WALL / STRUCTURE ALLOWANCE

    Internal + external walls also consume space.
    ---------------------------------------------------------
  */

  const wallFactor =
    country === "germany"
      ? 0.12
      : 0.10;

  const minimumWallArea =
    minimumRoomArea * wallFactor;

  const preferredWallArea =
    preferredRoomArea * wallFactor;


  /*
    ---------------------------------------------------------
    4. ESTIMATE TOTAL REQUIRED AREA
    ---------------------------------------------------------
  */

  const estimatedMinimumArea =
    minimumRoomArea +
    minimumCirculationArea +
    minimumWallArea;

  const estimatedPreferredArea =
    preferredRoomArea +
    preferredCirculationArea +
    preferredWallArea;


  /*
    ---------------------------------------------------------
    5. AVAILABLE BUILDABLE AREA
    ---------------------------------------------------------
  */

  const availableArea =
    areaInfo.buildable.area;


  /*
    ---------------------------------------------------------
    6. DETERMINE FEASIBILITY LEVEL

    comfortable:
      preferred program fits

    tight:
      minimum fits but preferred does not

    infeasible:
      even minimum program does not fit
    ---------------------------------------------------------
  */

  let status;

  if (
    availableArea >=
    estimatedPreferredArea
  ) {
    status = "comfortable";
  } else if (
    availableArea >=
    estimatedMinimumArea
  ) {
    status = "tight";
  } else {
    status = "infeasible";
  }


  /*
    ---------------------------------------------------------
    7. FIT RATIOS
    ---------------------------------------------------------
  */

  const minimumUsagePercent =
    availableArea > 0
      ? (
          estimatedMinimumArea /
          availableArea
        ) * 100
      : 0;

  const preferredUsagePercent =
    availableArea > 0
      ? (
          estimatedPreferredArea /
          availableArea
        ) * 100
      : 0;


  /*
    ---------------------------------------------------------
    8. GENERATE WARNINGS
    ---------------------------------------------------------
  */

  const warnings = [];


  if (status === "tight") {
    warnings.push(
      "The requested plan can fit, but some rooms may need to use minimum dimensions."
    );
  }


  if (status === "infeasible") {
    warnings.push(
      "The requested room program does not fit within the available buildable area using the selected design standards."
    );
  }


  /*
    ---------------------------------------------------------
    Country-specific planning warnings
    ---------------------------------------------------------
  */

  if (country === "germany") {
    const bedrooms =
      roomProgram.filter(
        room =>
          room.type === "bedroom" ||
          room.type === "masterBedroom"
      );

    if (bedrooms.length >= 4) {
      warnings.push(
        "For larger German residential layouts, daylight, exterior-wall access, circulation and local building rules may further reduce usable planning flexibility."
      );
    }
  }


  if (country === "india") {
    const bhk =
      Number(
        requirements.house?.bhk || 1
      );

    if (
      bhk >= 4 &&
      availableArea <
        estimatedPreferredArea
    ) {
      warnings.push(
        "For this larger BHK configuration, consider reducing optional spaces or using multiple floors if local regulations allow."
      );
    }
  }


  /*
    ---------------------------------------------------------
    9. RETURN FULL ANALYSIS
    ---------------------------------------------------------
  */

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
        round(minimumRoomArea),

      preferred:
        round(preferredRoomArea)
    },

    allowances: {
      circulationFactor,
      wallFactor,

      minimumCirculationArea:
        round(
          minimumCirculationArea
        ),

      preferredCirculationArea:
        round(
          preferredCirculationArea
        ),

      minimumWallArea:
        round(
          minimumWallArea
        ),

      preferredWallArea:
        round(
          preferredWallArea
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
          minimumUsagePercent
        ),

      preferredPercent:
        round(
          preferredUsagePercent
        )
    },

    rooms: roomBreakdown,

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
      value * factor
    ) / factor
  );
}
