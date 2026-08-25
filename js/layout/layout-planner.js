import {
  buildRoomProgram
} from "./room-program.js";

import {
  calculateBuildableArea
} from "./buildable-area.js";

import {
  checkPlanFeasibility
} from "./feasibility.js";

import {
  getDesignProfile
} from "./plan-schema.js";


/*
  Still In Queue · Layout Planner V14
  ------------------------------------
  Preferred path:
    connected architectural block layout

  Fallback:
    previous multi-strategy rectangle planner

  The connected template is intentionally optimized first for
  practical single-floor 3BHK homes because this is the current
  reference case. Other configurations safely fall back to the
  generic planner until their connected templates are added.
*/

export function generateLayout(requirements) {
  const connected =
    generateConnectedArchitecturalLayout(requirements);

  if (connected?.success) {
    return connected;
  }

  return legacyGenerateLayout(requirements);
}


function generateConnectedArchitecturalLayout(requirements) {
  const country =
    String(requirements.country || "india").toLowerCase();

  const bhk =
    Number(requirements.house?.bhk || 1);

  const floors =
    Number(requirements.house?.floors || 1);

  const roadSide =
    normalizeConnectedRoadSide(
      requirements.plot?.roadSide
    );

  /*
    V14 connected template:
    single-floor 3BHK + north/south road.

    This covers the current reference case and creates a much
    more architectural footprint than the older free packing.
  */
  if (
    bhk !== 3 ||
    floors !== 1 ||
    !["north", "south"].includes(roadSide)
  ) {
    return null;
  }

  const profile =
    getDesignProfile(country);

  const feasibility =
    checkPlanFeasibility(requirements);

  if (feasibility.status === "infeasible") {
    return null;
  }

  const areaInfo =
    calculateBuildableArea(requirements);

  const buildable =
    areaInfo.buildable;

  const program =
    buildRoomProgram({
      ...requirements,
      preferences: {
        ...(requirements.preferences || {}),

        /*
          A separate family lounge is not forced in this compact
          connected template unless the user explicitly asks for it.
        */
        familyLounge:
          requirements.preferences?.familyLounge === true
            ? true
            : false
      }
    });

  const byId =
    Object.fromEntries(
      program.map(room => [room.id, room])
    );

  const required = [
    "living",
    "dining",
    "kitchen",
    "bedroom-1",
    "bedroom-2",
    "bedroom-3",
    "attached-toilet-1",
    "attached-toilet-2",
    "common-toilet"
  ];

  if (
    required.some(id => !byId[id])
  ) {
    return null;
  }

  const unit =
    profile.unit;

  const corridorPreferred =
    Number(
      profile.roomDefaults.corridor
        ?.preferredWidth || 4
    );

  /*
    Slightly narrower circulation than the previous full-height
    strip, but still practical:
      India: 3.5 ft
      Germany: ~1.10 m
  */
  const corridorWidth =
    country === "germany"
      ? Math.min(1.10, buildable.width * 0.14)
      : Math.min(3.5, buildable.width * 0.14);

  const wingWidth =
    (buildable.width - corridorWidth) / 2;

  /*
    The connected template needs enough width for practical rooms.
  */
  const minimumWingWidth =
    country === "germany"
      ? 3.0
      : 10.0;

  if (wingWidth < minimumWingWidth) {
    return null;
  }

  const corridor = {
    id: "corridor-main",
    name: "Passage",
    type: "corridor",

    x:
      buildable.x +
      wingWidth,

    y:
      buildable.y,

    width:
      corridorWidth,

    height:
      buildable.height
  };

  const leftX =
    buildable.x;

  const rightX =
    corridor.x +
    corridor.width;

  const rooms = [];

  const living =
    cloneRoom(byId["living"]);

  const kitchen =
    cloneRoom(byId["kitchen"]);

  const master =
    cloneRoom(byId["bedroom-1"]);

  const masterToilet =
    cloneRoom(byId["attached-toilet-1"]);

  const utility =
    byId["utility"]
      ? cloneRoom(byId["utility"])
      : null;

  const dining =
    cloneRoom(byId["dining"]);

  const bed2 =
    cloneRoom(byId["bedroom-2"]);

  const bed3 =
    cloneRoom(byId["bedroom-3"]);

  const attached2 =
    cloneRoom(byId["attached-toilet-2"]);

  const common =
    cloneRoom(byId["common-toilet"]);

  /*
    ---------------------------------------------------------
    LEFT WING
      Living
      Kitchen
      Utility + Master Toilet
      Master Bedroom

    RIGHT WING
      Dining
      Common Toilet + Attached Toilet 2
      Bedroom 3
      Bedroom 2

    All bands share walls.
    No floating gaps.
    ---------------------------------------------------------
  */

  const leftServiceHeight =
    Math.max(
      utility?.minHeight || 0,
      masterToilet.minHeight || 0,
      country === "germany" ? 2.0 : 6.0
    );

  const rightServiceHeight =
    Math.max(
      common.minHeight || 0,
      attached2.minHeight || 0,
      country === "germany" ? 2.0 : 6.0
    );

  const roomScales =
    requirements.preferences?.roomScales || {};

  const leftFixed =
    scaledHeight(living, roomScales.living) +
    scaledHeight(kitchen, roomScales.kitchen) +
    leftServiceHeight +
    scaledHeight(master, roomScales.masterBedroom);

  const rightFixed =
    scaledHeight(dining, roomScales.dining) +
    rightServiceHeight +
    scaledHeight(bed3, roomScales.bedroom) +
    scaledHeight(bed2, roomScales.bedroom);

  const leftScale =
    buildable.height / leftFixed;

  const rightScale =
    buildable.height / rightFixed;

  /*
    We only accept moderate vertical scaling.
    Otherwise generic planner should take over.
  */
  if (
    leftScale < 0.82 ||
    rightScale < 0.82
  ) {
    return null;
  }

  const leftHeights = normalizeHeights(
    [
      scaledHeight(living, roomScales.living),
      scaledHeight(kitchen, roomScales.kitchen),
      leftServiceHeight,
      scaledHeight(master, roomScales.masterBedroom)
    ],
    buildable.height
  );

  const rightHeights = normalizeHeights(
    [
      scaledHeight(dining, roomScales.dining),
      rightServiceHeight,
      scaledHeight(bed3, roomScales.bedroom),
      scaledHeight(bed2, roomScales.bedroom)
    ],
    buildable.height
  );

  let yLeft =
    buildable.y;

  placeFullBand(
    rooms,
    living,
    leftX,
    yLeft,
    wingWidth,
    leftHeights[0]
  );
  yLeft += leftHeights[0];

  placeFullBand(
    rooms,
    kitchen,
    leftX,
    yLeft,
    wingWidth,
    leftHeights[1]
  );
  yLeft += leftHeights[1];

  if (utility) {
    const utilMinW =
      Math.max(
        utility.minWidth || 0,
        wingWidth * 0.42
      );

    const toiletMinW =
      masterToilet.minWidth || 0;

    let utilW =
      Math.max(
        wingWidth * 0.46,
        utilMinW
      );

    utilW =
      Math.min(
        utilW,
        wingWidth -
        Math.max(
          toiletMinW,
          wingWidth * 0.38
        )
      );

    utilW =
      Math.max(
        wingWidth * 0.40,
        utilW
      );

    const toiletW =
      wingWidth - utilW;

    placeRect(
      rooms,
      utility,
      leftX,
      yLeft,
      utilW,
      leftHeights[2]
    );

    placeRect(
      rooms,
      masterToilet,
      leftX + utilW,
      yLeft,
      toiletW,
      leftHeights[2]
    );
  } else {
    placeFullBand(
      rooms,
      masterToilet,
      leftX,
      yLeft,
      wingWidth,
      leftHeights[2]
    );
  }

  yLeft += leftHeights[2];

  placeFullBand(
    rooms,
    master,
    leftX,
    yLeft,
    wingWidth,
    leftHeights[3]
  );

  let yRight =
    buildable.y;

  placeFullBand(
    rooms,
    dining,
    rightX,
    yRight,
    wingWidth,
    rightHeights[0]
  );
  yRight += rightHeights[0];

  /*
    Put two toilets side-by-side in one compact service band.
  */
  const commonW =
    Math.max(
      common.minWidth || 0,
      wingWidth * 0.46
    );

  const attachedW =
    wingWidth -
    commonW;

  if (
    attachedW <
    Math.max(
      attached2.minWidth || 0,
      wingWidth * 0.34
    )
  ) {
    return null;
  }

  placeRect(
    rooms,
    common,
    rightX,
    yRight,
    commonW,
    rightHeights[1]
  );

  placeRect(
    rooms,
    attached2,
    rightX + commonW,
    yRight,
    attachedW,
    rightHeights[1]
  );

  yRight +=
    rightHeights[1];

  placeFullBand(
    rooms,
    bed3,
    rightX,
    yRight,
    wingWidth,
    rightHeights[2]
  );
  yRight += rightHeights[2];

  placeFullBand(
    rooms,
    bed2,
    rightX,
    yRight,
    wingWidth,
    rightHeights[3]
  );

  /*
    If south-facing, mirror the whole connected arrangement
    vertically so the public rooms remain toward the road.
  */
  if (roadSide === "south") {
    mirrorRoomsVertically(
      rooms,
      buildable
    );
  }

  /*
    Apply explicit room-direction changes from chat.
    For the connected template these are handled as left/right
    swaps where possible without destroying the connected plan.
  */
  applyConnectedPreferenceSwaps(
    rooms,
    requirements,
    buildable,
    corridor
  );

  const roomArea =
    rooms.reduce(
      (sum, room) =>
        sum +
        room.width *
        room.height,
      0
    );

  return {
    success: true,

    country,
    unit,
    roadSide,

    plot:
      areaInfo.plot,

    setbacks:
      areaInfo.setbacks,

    buildableArea:
      buildable,

    feasibility,

    circulation: [
      corridor
    ],

    rooms,

    failedRooms: [],

    placementStrategy:
      "connected-architectural-blocks",

    statistics: {
      requestedRooms:
        rooms.length,

      placedRooms:
        rooms.length,

      failedRooms:
        0,

      roomArea:
        roundConnected(roomArea),

      corridorArea:
        roundConnected(
          corridor.width *
          corridor.height
        )
    },

    adaptations: [
      {
        type:
          "connected-footprint",

        room:
          "Whole plan",

        reason:
          "Rooms were organized into connected wall-sharing bands around a compact central passage."
      }
    ]
  };
}


function cloneRoom(room) {
  return {
    ...room
  };
}


function preferredOrMinHeight(room) {
  return Number(
    room.preferredHeight ||
    room.minHeight ||
    1
  );
}


function scaledHeight(
  room,
  multiplier
) {
  const base =
    preferredOrMinHeight(room);

  const scale =
    Number.isFinite(
      Number(multiplier)
    )
      ? Number(multiplier)
      : 1;

  return (
    base *
    Math.max(
      0.72,
      Math.min(
        1.35,
        scale
      )
    )
  );
}


function normalizeHeights(
  heights,
  totalHeight
) {
  const sum =
    heights.reduce(
      (a, b) => a + b,
      0
    );

  const scaled =
    heights.map(
      h =>
        (h / sum) *
        totalHeight
    );

  /*
    Force final cell to close any floating point gap.
  */
  const beforeLast =
    scaled
      .slice(0, -1)
      .reduce(
        (a, b) => a + b,
        0
      );

  scaled[
    scaled.length - 1
  ] =
    totalHeight -
    beforeLast;

  return scaled;
}


function placeFullBand(
  target,
  room,
  x,
  y,
  width,
  height
) {
  placeRect(
    target,
    room,
    x,
    y,
    width,
    height
  );
}


function placeRect(
  target,
  room,
  x,
  y,
  width,
  height
) {
  target.push({
    ...room,

    x:
      roundConnected(x),

    y:
      roundConnected(y),

    width:
      roundConnected(width),

    height:
      roundConnected(height),

    area:
      roundConnected(
        width *
        height
      )
  });
}


function mirrorRoomsVertically(
  rooms,
  buildable
) {
  for (
    const room
    of rooms
  ) {
    const offset =
      room.y -
      buildable.y;

    room.y =
      roundConnected(
        buildable.y +
        buildable.height -
        offset -
        room.height
      );
  }
}


function applyConnectedPreferenceSwaps(
  rooms,
  requirements,
  buildable,
  corridor
) {
  const preferences =
    requirements.preferences || {};

  /*
    Kitchen west/east preference:
    swap entire kitchen band with dining band when direction
    explicitly points to the opposite side.

    This preserves a coherent connected plan.
  */
  const kitchen =
    rooms.find(
      room =>
        room.id === "kitchen"
    );

  const dining =
    rooms.find(
      room =>
        room.id === "dining"
    );

  const kitchenDirection =
    String(
      preferences.kitchenDirection || ""
    ).toLowerCase();

  if (
    kitchen &&
    dining &&
    [
      "east",
      "northeast",
      "southeast"
    ].includes(
      kitchenDirection
    )
  ) {
    const kx =
      kitchen.x;

    kitchen.x =
      dining.x;

    dining.x =
      kx;
  }

  /*
    Master preference east/west:
    swap master with the rear-most bedroom if explicitly asked.
  */
  const master =
    rooms.find(
      room =>
        room.id === "bedroom-1"
    );

  const alternatives =
    rooms
      .filter(
        room =>
          room.type === "bedroom"
      )
      .sort(
        (a, b) =>
          b.y - a.y
      );

  const masterDirection =
    String(
      preferences.masterBedroomDirection ||
      ""
    ).toLowerCase();

  if (
    master &&
    alternatives.length &&
    [
      "east",
      "northeast",
      "southeast"
    ].includes(
      masterDirection
    ) &&
    master.x <
      corridor.x
  ) {
    const other =
      alternatives[0];

    const mx =
      master.x;

    master.x =
      other.x;

    other.x =
      mx;
  }
}


function normalizeConnectedRoadSide(
  roadSide
) {
  const value =
    String(
      roadSide ||
      "north"
    ).toLowerCase();

  if (
    [
      "north",
      "south",
      "east",
      "west"
    ].includes(
      value
    )
  ) {
    return value;
  }

  return "north";
}


function roundConnected(
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


function legacyGenerateLayout(requirements) {
  /*
    First try the requested/default room program exactly as-is.
  */
  let result = generateLayoutAttempt(requirements);

  if (result.success) {
    return result;
  }

  /*
    ---------------------------------------------------------
    ADAPTIVE COMPACT FALLBACK

    If ANY required room cannot be placed, remove the
    automatically-added family lounge and retry, unless the
    user explicitly requested that lounge.

    This is practical for compact 3BHK / 4BHK Indian plots:
    bedrooms, bathrooms, kitchen, dining and circulation take
    priority over a separate optional family lounge.

    IMPORTANT:
    If the user explicitly requested a family lounge,
    we do NOT remove it automatically.
    ---------------------------------------------------------
  */

  const preferences =
    requirements.preferences || {};

  const familyLoungeExplicit =
    typeof preferences.familyLounge === "boolean";

  const hasFailedRooms =
    Array.isArray(result.failedRooms) &&
    result.failedRooms.length > 0;

  if (
    hasFailedRooms &&
    !familyLoungeExplicit
  ) {
    const compactRequirements = {
      ...requirements,

      preferences: {
        ...preferences,
        familyLounge: false
      }
    };

    const compactResult =
      generateLayoutAttempt(
        compactRequirements
      );

    if (compactResult.success) {
      compactResult.adaptations = [
        {
          type: "removed-optional-room",
          room: "Family Lounge",
          reason:
            "The buildable area is tight, so the separate family lounge was removed. Living and dining should serve as the shared family space."
        }
      ];

      compactResult.originalFeasibility =
        result.feasibility;

      return compactResult;
    }

    result = compactResult;
  }

  /*
    ---------------------------------------------------------
    SECOND COMPACT FALLBACK

    Utility is useful but not more important than bedrooms,
    bathrooms, living, dining, kitchen and circulation.

    If the retry still cannot place all required rooms and
    utility was only added by default, remove it and retry.
    ---------------------------------------------------------
  */

  const utilityExplicit =
    typeof preferences.utility === "boolean";

  const stillHasFailedRooms =
    Array.isArray(result.failedRooms) &&
    result.failedRooms.length > 0;

  if (
    stillHasFailedRooms &&
    !utilityExplicit
  ) {
    const compactRequirements = {
      ...requirements,

      preferences: {
        ...preferences,
        familyLounge:
          familyLoungeExplicit
            ? preferences.familyLounge
            : false,

        utility: false
      }
    };

    const compactResult =
      generateLayoutAttempt(
        compactRequirements
      );

    if (compactResult.success) {
      compactResult.adaptations = [
        {
          type: "removed-optional-room",
          room: "Utility",
          reason:
            "The buildable area is tight, so the separate utility room was removed. Utility functions can be integrated beside or within the kitchen."
        }
      ];

      if (!familyLoungeExplicit) {
        compactResult.adaptations.unshift({
          type: "removed-optional-room",
          room: "Family Lounge",
          reason:
            "The buildable area is tight, so the separate family lounge was removed."
        });
      }

      compactResult.originalFeasibility =
        result.feasibility;

      return compactResult;
    }

    result = compactResult;
  }

  return result;
}


function generateLayoutAttempt(requirements) {
  const feasibility =
    checkPlanFeasibility(requirements);

  /*
    Do not try to create a broken plan when even the
    minimum room program cannot fit.
  */
  if (
    feasibility.status === "infeasible"
  ) {
    return {
      success: false,
      reason: "infeasible",
      feasibility,
      rooms: [],
      circulation: [],
      failedRooms: []
    };
  }

  const country = String(
    requirements.country || "india"
  ).toLowerCase();

  const profile =
    getDesignProfile(country);

  const areaInfo =
    calculateBuildableArea(
      requirements
    );

  const buildable =
    areaInfo.buildable;

  const roadSide =
    normalizeRoadSide(
      requirements.plot?.roadSide
    );

  const rooms =
    buildRoomProgram(
      requirements
    );

  /*
    ---------------------------------------------------------
    1. CREATE MAIN CIRCULATION SPINE
    ---------------------------------------------------------
  */

  const corridor =
    createMainCorridor(
      buildable,
      roadSide,
      profile
    );

  /*
    ---------------------------------------------------------
    2. FREE RECTANGLES

    Corridor is reserved first.
    Rooms can only use remaining space.
    ---------------------------------------------------------
  */

  let freeRects =
    createInitialFreeRectangles(
      buildable,
      corridor,
      roadSide
    );

  /*
    ---------------------------------------------------------
    3. MULTI-STRATEGY PLACEMENT

    A single greedy room order is too fragile for floor plans.
    We now try several deterministic room orders and keep the
    best result.

    Tight layouts also prefer compact/minimum dimensions.
    ---------------------------------------------------------
  */

  const compactMode =
    feasibility.status === "tight";

  const strategies = [
    {
      name: "balanced",
      rooms: [...rooms].sort(
        (a, b) =>
          getPlacementPriority(a) -
          getPlacementPriority(b)
      )
    },

    {
      name: "large-first",
      rooms: [...rooms].sort(
        (a, b) =>
          preferredArea(b) -
          preferredArea(a)
      )
    },

    {
      name: "social-core",
      rooms: [...rooms].sort(
        (a, b) =>
          getSocialCorePriority(a) -
          getSocialCorePriority(b)
      )
    },

    {
      name: "wet-core",
      rooms: [...rooms].sort(
        (a, b) =>
          getWetCorePriority(a) -
          getWetCorePriority(b)
      )
    }
  ];

  const placementAttempts =
    strategies.map(
      strategy =>
        runPlacementAttempt({
          orderedRooms:
            strategy.rooms,

          buildable,
          corridor,
          roadSide,
          compactMode,

          strategyName:
            strategy.name
        })
    );

  placementAttempts.sort(
    (a, b) => {
      if (
        a.failedRooms.length !==
        b.failedRooms.length
      ) {
        return (
          a.failedRooms.length -
          b.failedRooms.length
        );
      }

      if (
        a.placedRooms.length !==
        b.placedRooms.length
      ) {
        return (
          b.placedRooms.length -
          a.placedRooms.length
        );
      }

      return (
        a.roomArea -
        b.roomArea
      );
    }
  );

  const bestAttempt =
    placementAttempts[0];

  const placedRooms =
    bestAttempt.placedRooms;

  const failedRooms =
    bestAttempt.failedRooms;

  freeRects =
    bestAttempt.freeRects;


  /*
    ---------------------------------------------------------
    5. FINAL RESULT
    ---------------------------------------------------------
  */

  const success =
    failedRooms.length === 0;

  return {
    success,

    country,
    unit:
      profile.unit,

    roadSide,

    plot:
      areaInfo.plot,

    setbacks:
      areaInfo.setbacks,

    buildableArea:
      buildable,

    feasibility,

    circulation: [
      corridor
    ],

    rooms:
      placedRooms,

    failedRooms,

    placementStrategy:
      bestAttempt.strategyName,

    statistics: {
      requestedRooms:
        rooms.length,

      placedRooms:
        placedRooms.length,

      failedRooms:
        failedRooms.length,

      roomArea:
        round(
          placedRooms.reduce(
            (sum, room) =>
              sum + room.area,
            0
          )
        ),

      corridorArea:
        round(
          corridor.width *
          corridor.height
        )
    },

    adaptations: []
  };
}


/*
  =========================================================
  MAIN CORRIDOR
  =========================================================
*/

function createMainCorridor(
  buildable,
  roadSide,
  profile
) {
  const corridorDefaults =
    profile.roomDefaults.corridor;

  const preferredWidth =
    corridorDefaults.preferredWidth;

  /*
    North / south road:
    vertical circulation spine.

    East / west road:
    horizontal circulation spine.
  */

  if (
    roadSide === "north" ||
    roadSide === "south"
  ) {
    const corridorWidth =
      Math.min(
        preferredWidth,
        buildable.width * 0.18
      );

    return {
      id:
        "corridor-main",

      name:
        "Passage",

      type:
        "corridor",

      x:
        buildable.x +
        buildable.width / 2 -
        corridorWidth / 2,

      y:
        buildable.y,

      width:
        corridorWidth,

      height:
        buildable.height
    };
  }

  const corridorWidth =
    Math.min(
      preferredWidth,
      buildable.height * 0.18
    );

  return {
    id:
      "corridor-main",

    name:
      "Passage",

    type:
      "corridor",

    x:
      buildable.x,

    y:
      buildable.y +
      buildable.height / 2 -
      corridorWidth / 2,

    width:
      buildable.width,

    height:
      corridorWidth
  };
}


/*
  =========================================================
  INITIAL FREE SPACE
  =========================================================
*/

function createInitialFreeRectangles(
  buildable,
  corridor,
  roadSide
) {
  if (
    roadSide === "north" ||
    roadSide === "south"
  ) {
    return [
      {
        x:
          buildable.x,

        y:
          buildable.y,

        width:
          corridor.x -
          buildable.x,

        height:
          buildable.height
      },

      {
        x:
          corridor.x +
          corridor.width,

        y:
          buildable.y,

        width:
          buildable.x +
          buildable.width -
          corridor.x -
          corridor.width,

        height:
          buildable.height
      }
    ].filter(
      isUsableRectangle
    );
  }

  return [
    {
      x:
        buildable.x,

      y:
        buildable.y,

      width:
        buildable.width,

      height:
        corridor.y -
        buildable.y
    },

    {
      x:
        buildable.x,

      y:
        corridor.y +
        corridor.height,

      width:
        buildable.width,

      height:
        buildable.y +
        buildable.height -
        corridor.y -
        corridor.height
    }
  ].filter(
    isUsableRectangle
  );
}


/*
  =========================================================
  MULTI-STRATEGY PLACEMENT HELPERS
  =========================================================
*/

function runPlacementAttempt({
  orderedRooms,
  buildable,
  corridor,
  roadSide,
  compactMode,
  strategyName
}) {
  let freeRects =
    createInitialFreeRectangles(
      buildable,
      corridor,
      roadSide
    );

  const placedRooms = [];
  const failedRooms = [];

  for (
    const room
    of orderedRooms
  ) {
    const candidate =
      findBestPlacement({
        room,
        freeRects,
        buildable,
        roadSide,
        placedRooms,
        compactMode
      });

    if (!candidate) {
      failedRooms.push({
        id: room.id,
        name: room.name,
        type: room.type,
        reason:
          "No valid rectangle could be found."
      });

      continue;
    }

    const placed = {
      ...room,

      x:
        round(candidate.x),

      y:
        round(candidate.y),

      width:
        round(candidate.width),

      height:
        round(candidate.height),

      area:
        round(
          candidate.width *
          candidate.height
        )
    };

    placedRooms.push(
      placed
    );

    freeRects =
      subtractPlacedRectangle(
        freeRects,
        placed
      );
  }

  return {
    strategyName,
    placedRooms,
    failedRooms,
    freeRects,

    roomArea:
      round(
        placedRooms.reduce(
          (sum, room) =>
            sum + room.area,
          0
        )
      )
  };
}


function preferredArea(room) {
  const width =
    Number(
      room.preferredWidth ||
      room.minWidth ||
      0
    );

  const height =
    Number(
      room.preferredHeight ||
      room.minHeight ||
      0
    );

  return (
    width *
    height
  );
}


function getSocialCorePriority(
  room
) {
  switch (
    room.type
  ) {
    case "living":
      return 10;

    case "dining":
      return 15;

    case "kitchen":
      return 20;

    case "masterBedroom":
      return 30;

    case "bedroom":
      return 35;

    case "attachedToilet":
      return 40;

    case "commonToilet":
      return 42;

    case "familyLounge":
      return 50;

    case "utility":
      return 60;

    case "puja":
      return 65;

    case "store":
      return 70;

    default:
      return 100;
  }
}


function getWetCorePriority(
  room
) {
  switch (
    room.type
  ) {
    case "masterBedroom":
      return 10;

    case "bedroom":
      return 15;

    case "attachedToilet":
      return 20;

    case "commonToilet":
      return 22;

    case "kitchen":
      return 30;

    case "dining":
      return 35;

    case "living":
      return 40;

    case "familyLounge":
      return 50;

    case "utility":
      return 60;

    case "puja":
      return 65;

    case "store":
      return 70;

    default:
      return 100;
  }
}


/*
  =========================================================
  ROOM PRIORITY
  =========================================================
*/

function getPlacementPriority(
  room
) {
  switch (
    room.type
  ) {
    case "living":
      return 10;

    case "masterBedroom":
      return 20;

    case "bedroom":
      return 25;

    case "attachedToilet":
      return 26;

    case "commonToilet":
      return 27;

    case "kitchen":
      return 30;

    case "dining":
      return 35;

    case "familyLounge":
      return 40;

    case "utility":
      return 60;

    case "puja":
      return 65;

    case "store":
      return 70;

    default:
      return 100;
  }
}


/*
  =========================================================
  FIND BEST ROOM POSITION
  =========================================================
*/

function findBestPlacement({
  room,
  freeRects,
  buildable,
  roadSide,
  placedRooms,
  compactMode = false
}) {
  const sizes =
    getPossibleRoomSizes(
      room
    );

  const candidates = [];

  for (
    const freeRect
    of freeRects
  ) {
    for (
      const size
      of sizes
    ) {
      if (
        size.width >
          freeRect.width ||
        size.height >
          freeRect.height
      ) {
        continue;
      }

      const positions = [
        {
          x:
            freeRect.x,

          y:
            freeRect.y
        },

        {
          x:
            freeRect.x +
            freeRect.width -
            size.width,

          y:
            freeRect.y
        },

        {
          x:
            freeRect.x,

          y:
            freeRect.y +
            freeRect.height -
            size.height
        },

        {
          x:
            freeRect.x +
            freeRect.width -
            size.width,

          y:
            freeRect.y +
            freeRect.height -
            size.height
        }
      ];

      for (
        const position
        of positions
      ) {
        const candidate = {
          x:
            position.x,

          y:
            position.y,

          width:
            size.width,

          height:
            size.height
        };

        const score =
          scoreCandidate({
            room,
            candidate,
            buildable,
            roadSide,
            placedRooms,
            sizeType:
              size.type,
            compactMode
          });

        candidates.push({
          ...candidate,
          score
        });
      }
    }
  }

  if (
    !candidates.length
  ) {
    return null;
  }

  candidates.sort(
    (a, b) =>
      a.score -
      b.score
  );

  return candidates[0];
}


/*
  =========================================================
  ROOM SIZE OPTIONS
  =========================================================
*/

function getPossibleRoomSizes(
  room
) {
  const preferredWidth =
    Number(
      room.preferredWidth ||
      room.minWidth
    );

  const preferredHeight =
    Number(
      room.preferredHeight ||
      room.minHeight
    );

  const minWidth =
    Number(
      room.minWidth
    );

  const minHeight =
    Number(
      room.minHeight
    );

  const sizes = [];

  sizes.push({
    width:
      preferredWidth,

    height:
      preferredHeight,

    type:
      "preferred"
  });

  if (
    preferredWidth !==
    preferredHeight
  ) {
    sizes.push({
      width:
        preferredHeight,

      height:
        preferredWidth,

      type:
        "preferred"
    });
  }

  /*
    Mid-size option between preferred and minimum.

    This gives the planner more flexibility than jumping
    directly from preferred dimensions to the minimum.
  */

  const midWidth =
    round(
      (
        preferredWidth +
        minWidth
      ) / 2
    );

  const midHeight =
    round(
      (
        preferredHeight +
        minHeight
      ) / 2
    );

  sizes.push({
    width:
      midWidth,

    height:
      midHeight,

    type:
      "compact"
  });

  if (
    midWidth !==
    midHeight
  ) {
    sizes.push({
      width:
        midHeight,

      height:
        midWidth,

      type:
        "compact"
    });
  }

  sizes.push({
    width:
      minWidth,

    height:
      minHeight,

    type:
      "minimum"
  });

  if (
    minWidth !==
    minHeight
  ) {
    sizes.push({
      width:
        minHeight,

      height:
        minWidth,

      type:
        "minimum"
    });
  }

  return removeDuplicateSizes(
    sizes
  );
}


/*
  =========================================================
  CANDIDATE SCORING
  =========================================================
*/

function scoreCandidate({
  room,
  candidate,
  buildable,
  roadSide,
  placedRooms,
  sizeType,
  compactMode = false
}) {
  let score = 0;

  /*
    Tight plans should use compact/minimum dimensions before
    sacrificing required rooms such as dining or bathrooms.
  */
  if (compactMode) {
    if (
      sizeType ===
      "preferred"
    ) {
      score += 24;
    } else if (
      sizeType ===
      "compact"
    ) {
      score += 6;
    }
  } else {
    if (
      sizeType ===
      "compact"
    ) {
      score += 7;
    }

    if (
      sizeType ===
      "minimum"
    ) {
      score += 15;
    }
  }

  const center = {
    x:
      candidate.x +
      candidate.width / 2,

    y:
      candidate.y +
      candidate.height / 2
  };

  const normalized = {
    x:
      (
        center.x -
        buildable.x
      ) /
      buildable.width,

    y:
      (
        center.y -
        buildable.y
      ) /
      buildable.height
  };

  const target =
    getRoomTarget(
      room,
      roadSide
    );

  score +=
    distance(
      normalized,
      target
    ) *
    100;

  if (
    room.preferredDirection
  ) {
    const directionTarget =
      getDirectionTarget(
        room.preferredDirection
      );

    if (
      directionTarget
    ) {
      score +=
        distance(
          normalized,
          directionTarget
        ) *
        80;
    }
  }

  if (
    room.requiresExteriorWall &&
    !touchesExteriorWall(
      candidate,
      buildable
    )
  ) {
    score += 80;
  }

  if (
    room.attachedTo
  ) {
    const parent =
      placedRooms.find(
        placed =>
          placed.id ===
          room.attachedTo
      );

    if (
      parent
    ) {
      score +=
        rectangleDistance(
          candidate,
          parent
        ) *
        12;

      if (
        rectanglesTouch(
          candidate,
          parent
        )
      ) {
        score -= 80;
      }
    }
  }

  if (
    Array.isArray(
      room.preferredNear
    )
  ) {
    for (
      const preferredId
      of room.preferredNear
    ) {
      const neighbour =
        placedRooms.find(
          placed =>
            placed.id ===
            preferredId
        );

      if (
        !neighbour
      ) {
        continue;
      }

      score +=
        rectangleDistance(
          candidate,
          neighbour
        ) *
        5;

      if (
        rectanglesTouch(
          candidate,
          neighbour
        )
      ) {
        score -= 30;
      }
    }
  }

  return score;
}


/*
  =========================================================
  ARCHITECTURAL TARGETS
  =========================================================
*/

function getRoomTarget(
  room,
  roadSide
) {
  let depth;

  switch (
    room.zone
  ) {
    case "public":
      depth = 0.15;
      break;

    case "semiPublic":
      depth = 0.42;
      break;

    case "private":
      depth = 0.78;
      break;

    case "service":
      depth = 0.58;
      break;

    default:
      depth = 0.50;
  }

  switch (
    roadSide
  ) {
    case "south":
      return {
        x: 0.5,
        y: 1 - depth
      };

    case "east":
      return {
        x: 1 - depth,
        y: 0.5
      };

    case "west":
      return {
        x: depth,
        y: 0.5
      };

    case "north":
    default:
      return {
        x: 0.5,
        y: depth
      };
  }
}


/*
  =========================================================
  COMPASS TARGETS
  =========================================================
*/

function getDirectionTarget(
  direction
) {
  const normalized =
    String(
      direction
    )
      .toLowerCase()
      .replace(
        /[\s_-]/g,
        ""
      );

  const directions = {
    north: {
      x: 0.5,
      y: 0.1
    },

    northeast: {
      x: 0.85,
      y: 0.15
    },

    east: {
      x: 0.9,
      y: 0.5
    },

    southeast: {
      x: 0.85,
      y: 0.85
    },

    south: {
      x: 0.5,
      y: 0.9
    },

    southwest: {
      x: 0.15,
      y: 0.85
    },

    west: {
      x: 0.1,
      y: 0.5
    },

    northwest: {
      x: 0.15,
      y: 0.15
    }
  };

  return (
    directions[
      normalized
    ] ||
    null
  );
}


/*
  =========================================================
  FREE RECTANGLE MANAGEMENT
  =========================================================
*/

function subtractPlacedRectangle(
  freeRects,
  placed
) {
  const newFreeRects = [];

  for (
    const free
    of freeRects
  ) {
    if (
      !rectanglesOverlap(
        free,
        placed
      )
    ) {
      newFreeRects.push(
        free
      );

      continue;
    }

    const freeRight =
      free.x +
      free.width;

    const freeBottom =
      free.y +
      free.height;

    const placedRight =
      placed.x +
      placed.width;

    const placedBottom =
      placed.y +
      placed.height;

    if (
      placed.x >
      free.x
    ) {
      newFreeRects.push({
        x:
          free.x,

        y:
          free.y,

        width:
          placed.x -
          free.x,

        height:
          free.height
      });
    }

    if (
      placedRight <
      freeRight
    ) {
      newFreeRects.push({
        x:
          placedRight,

        y:
          free.y,

        width:
          freeRight -
          placedRight,

        height:
          free.height
      });
    }

    if (
      placed.y >
      free.y
    ) {
      newFreeRects.push({
        x:
          free.x,

        y:
          free.y,

        width:
          free.width,

        height:
          placed.y -
          free.y
      });
    }

    if (
      placedBottom <
      freeBottom
    ) {
      newFreeRects.push({
        x:
          free.x,

        y:
          placedBottom,

        width:
          free.width,

        height:
          freeBottom -
          placedBottom
      });
    }
  }

  return pruneFreeRectangles(
    newFreeRects.filter(
      isUsableRectangle
    )
  );
}


/*
  Remove free rectangles completely contained inside
  another free rectangle.
*/

function pruneFreeRectangles(
  rectangles
) {
  return rectangles.filter(
    (rect, index) => {
      return !rectangles.some(
        (
          other,
          otherIndex
        ) => {
          if (
            index ===
            otherIndex
          ) {
            return false;
          }

          return rectangleContains(
            other,
            rect
          );
        }
      );
    }
  );
}


/*
  =========================================================
  GEOMETRY HELPERS
  =========================================================
*/

function rectanglesOverlap(
  a,
  b
) {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}


function rectanglesTouch(
  a,
  b
) {
  const tolerance =
    0.01;

  const horizontalTouch =
    (
      Math.abs(
        a.x +
        a.width -
        b.x
      ) <
      tolerance ||

      Math.abs(
        b.x +
        b.width -
        a.x
      ) <
      tolerance
    ) &&
    rangesOverlap(
      a.y,
      a.y +
      a.height,
      b.y,
      b.y +
      b.height
    );

  const verticalTouch =
    (
      Math.abs(
        a.y +
        a.height -
        b.y
      ) <
      tolerance ||

      Math.abs(
        b.y +
        b.height -
        a.y
      ) <
      tolerance
    ) &&
    rangesOverlap(
      a.x,
      a.x +
      a.width,
      b.x,
      b.x +
      b.width
    );

  return (
    horizontalTouch ||
    verticalTouch
  );
}


function rangesOverlap(
  a1,
  a2,
  b1,
  b2
) {
  return (
    Math.min(
      a2,
      b2
    ) >
    Math.max(
      a1,
      b1
    )
  );
}


function rectangleContains(
  outer,
  inner
) {
  return (
    inner.x >=
      outer.x &&

    inner.y >=
      outer.y &&

    inner.x +
      inner.width <=
      outer.x +
      outer.width &&

    inner.y +
      inner.height <=
      outer.y +
      outer.height
  );
}


function rectangleDistance(
  a,
  b
) {
  const ax =
    a.x +
    a.width / 2;

  const ay =
    a.y +
    a.height / 2;

  const bx =
    b.x +
    b.width / 2;

  const by =
    b.y +
    b.height / 2;

  return Math.hypot(
    ax - bx,
    ay - by
  );
}


function distance(
  a,
  b
) {
  return Math.hypot(
    a.x - b.x,
    a.y - b.y
  );
}


function touchesExteriorWall(
  room,
  buildable
) {
  const tolerance =
    0.01;

  return (
    Math.abs(
      room.x -
      buildable.x
    ) <
      tolerance ||

    Math.abs(
      room.y -
      buildable.y
    ) <
      tolerance ||

    Math.abs(
      room.x +
      room.width -
      (
        buildable.x +
        buildable.width
      )
    ) <
      tolerance ||

    Math.abs(
      room.y +
      room.height -
      (
        buildable.y +
        buildable.height
      )
    ) <
      tolerance
  );
}


function isUsableRectangle(
  rect
) {
  return (
    rect.width >
      0.01 &&
    rect.height >
      0.01
  );
}


function removeDuplicateSizes(
  sizes
) {
  const seen =
    new Set();

  return sizes.filter(
    size => {
      const key =
        `${size.width}x${size.height}`;

      if (
        seen.has(
          key
        )
      ) {
        return false;
      }

      seen.add(
        key
      );

      return true;
    }
  );
}


function normalizeRoadSide(
  roadSide
) {
  const value =
    String(
      roadSide ||
      "north"
    ).toLowerCase();

  if (
    [
      "north",
      "south",
      "east",
      "west"
    ].includes(
      value
    )
  ) {
    return value;
  }

  return "north";
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
