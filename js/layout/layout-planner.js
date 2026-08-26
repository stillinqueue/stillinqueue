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
  Still In Queue · Architectural Planner V16
  -------------------------------------------
  Primary goal:
  create a compact CONNECTED floor plan for a single-floor 3BHK.

  Key change from the previous version:
  - NO full-height corridor
  - compact central lobby/hall
  - rooms share walls
  - wet areas are grouped
  - attached toilets sit beside bedrooms
  - living/dining are connected at the front
  - bedrooms form a private rear zone

  Other configurations safely fall back to the previous
  multi-strategy planner.
*/

export function generateLayout(requirements) {
  const compact =
    generateCompact3BHK(requirements);

  if (compact?.success) {
    return compact;
  }

  return legacyGenerateLayout(requirements);
}


function generateCompact3BHK(requirements) {
  const country =
    String(requirements.country || "india").toLowerCase();

  const bhk =
    Number(requirements.house?.bhk || 1);

  const floors =
    Number(requirements.house?.floors || 1);

  const roadSide =
    normalizeRoadSideV16(requirements.plot?.roadSide);

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

  const b =
    areaInfo.buildable;

  const preferences =
    requirements.preferences || {};

  const roomScales =
    preferences.roomScales || {};

  const livingScale =
    clampV16(Number(roomScales.living || 1), 0.82, 1.25);

  const diningScale =
    clampV16(Number(roomScales.dining || 1), 0.82, 1.25);

  const kitchenScale =
    clampV16(Number(roomScales.kitchen || 1), 0.82, 1.25);

  const masterScale =
    clampV16(Number(roomScales.masterBedroom || 1), 0.82, 1.25);

  const bedroomScale =
    clampV16(Number(roomScales.bedroom || 1), 0.82, 1.25);

  /*
    For this compact template:
    family lounge is represented by the central lobby / living-dining
    connection unless user explicitly asks for a separate lounge.
  */
  const program =
    buildRoomProgram({
      ...requirements,
      preferences: {
        ...preferences,
        familyLounge:
          preferences.familyLounge === true
            ? true
            : false
      }
    });

  const byId =
    Object.fromEntries(
      program.map(room => [room.id, { ...room }])
    );

  const requiredIds = [
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
    requiredIds.some(id => !byId[id])
  ) {
    return null;
  }

  /*
    Practical proportions.
    30x40 India example after setbacks:
      ~27 x 35 ft buildable.

    We use four connected bands:
      FRONT        living + dining
      MIDDLE       kitchen + lobby + bed3
      WET CORE     utility + toilets + lobby
      REAR         master + bed2

    This produces one connected footprint instead of
    two wings divided by a full-height passage.
  */

  const frontH =
    clampV16(
      b.height *
        0.27 *
        Math.max(
          0.90,
          Math.min(
            1.12,
            (livingScale + diningScale) / 2
          )
        ),
      country === "germany" ? 3.2 : 9.0,
      country === "germany" ? 4.2 : 11.0
    );

  const middleH =
    clampV16(
      b.height *
        0.25 *
        Math.max(
          0.90,
          Math.min(
            1.10,
            (kitchenScale + bedroomScale) / 2
          )
        ),
      country === "germany" ? 2.8 : 8.0,
      country === "germany" ? 3.8 : 10.0
    );

  const wetH =
    clampV16(
      b.height * 0.16,
      country === "germany" ? 1.8 : 5.5,
      country === "germany" ? 2.5 : 7.0
    );

  const rearH =
    b.height -
    frontH -
    middleH -
    wetH;

  const minRear =
    country === "germany"
      ? 3.0
      : 10.0;

  if (rearH < minRear) {
    return null;
  }

  const lobbyW =
    country === "germany"
      ? clampV16(b.width * 0.13, 1.05, 1.30)
      : clampV16(b.width * 0.13, 3.25, 3.75);

  const leftWeight =
    1.04 *
    (
      livingScale +
      kitchenScale +
      masterScale
    ) / 3;

  const rightWeight =
    (
      diningScale +
      bedroomScale +
      bedroomScale
    ) / 3;

  const usableWingWidth =
    b.width -
    lobbyW;

  const leftW =
    usableWingWidth *
    leftWeight /
    (
      leftWeight +
      rightWeight
    );

  const rightW =
    usableWingWidth -
    leftW;

  const xLeft =
    b.x;

  const xLobby =
    b.x + leftW;

  const xRight =
    xLobby + lobbyW;

  const yFront =
    b.y;

  const yMiddle =
    yFront + frontH;

  const yWet =
    yMiddle + middleH;

  const yRear =
    yWet + wetH;

  const rooms = [];

  /*
    FRONT BAND
  */
  placeV16(
    rooms,
    byId["living"],
    xLeft,
    yFront,
    leftW + lobbyW * 0.25,
    frontH
  );

  placeV16(
    rooms,
    byId["dining"],
    xLeft + leftW + lobbyW * 0.25,
    yFront,
    rightW + lobbyW * 0.75,
    frontH
  );

  /*
    MIDDLE BAND
  */
  placeV16(
    rooms,
    byId["kitchen"],
    xLeft,
    yMiddle,
    leftW,
    middleH
  );

  placeV16(
    rooms,
    byId["bedroom-3"],
    xRight,
    yMiddle,
    rightW,
    middleH
  );

  /*
    WET CORE
    Left: utility + master toilet
    Right: common toilet + attached toilet 2
  */

  const utility =
    byId["utility"];

  const masterToilet =
    byId["attached-toilet-1"];

  const commonToilet =
    byId["common-toilet"];

  const attached2 =
    byId["attached-toilet-2"];

  if (utility) {
    const utilW =
      leftW * 0.46;

    placeV16(
      rooms,
      utility,
      xLeft,
      yWet,
      utilW,
      wetH
    );

    placeV16(
      rooms,
      masterToilet,
      xLeft + utilW,
      yWet,
      leftW - utilW,
      wetH
    );
  } else {
    placeV16(
      rooms,
      masterToilet,
      xLeft,
      yWet,
      leftW,
      wetH
    );
  }

  const commonW =
    rightW * 0.52;

  placeV16(
    rooms,
    commonToilet,
    xRight,
    yWet,
    commonW,
    wetH
  );

  placeV16(
    rooms,
    attached2,
    xRight + commonW,
    yWet,
    rightW - commonW,
    wetH
  );

  /*
    REAR BAND
  */
  placeV16(
    rooms,
    byId["bedroom-1"],
    xLeft,
    yRear,
    leftW + lobbyW * 0.15,
    rearH
  );

  placeV16(
    rooms,
    byId["bedroom-2"],
    xLeft + leftW + lobbyW * 0.15,
    yRear,
    rightW + lobbyW * 0.85,
    rearH
  );

  /*
    COMPACT CIRCULATION HUB

    Instead of a full-height central strip, use two rectangles:
    - vertical lobby through middle + wet core
    - short horizontal landing before rear bedrooms

    This looks much closer to real residential circulation.
  */
  const verticalLobby = {
    id: "lobby-main",
    name: "Lobby",
    type: "corridor",

    x:
      xLobby,

    y:
      yMiddle,

    width:
      lobbyW,

    height:
      middleH + wetH
  };

  const landingDepth =
    country === "germany"
      ? Math.min(1.2, rearH * 0.20)
      : Math.min(4.0, rearH * 0.22);

  const rearLanding = {
    id: "lobby-rear",
    name: "Landing",
    type: "corridor",

    x:
      xLeft + leftW * 0.38,

    y:
      yRear,

    width:
      b.width - leftW * 0.76,

    height:
      landingDepth
  };


  /*
    Bedroom passage extension.

    Normal plan:
      short connection into the private bedroom zone.

    User asks:
      "extend passage till middle of Bedroom 2"
      -> extend to roughly half the rear bedroom depth.
  */
  const bedroomPassageDepth =
    preferences.extendBedroomPassage
      ? rearH * 0.52
      : rearH * 0.22;

  const bedroomPassage = {
    id:
      "bedroom-passage",

    name:
      "Bedroom Hall",

    type:
      "corridor",

    overlay:
      true,

    x:
      xLobby,

    y:
      yRear,

    width:
      lobbyW,

    height:
      bedroomPassageDepth
  };

  const bedroomEntryY =
    roundV16(
      yRear +
      bedroomPassageDepth *
      0.72
    );

  const interiorDoors = [
    {
      id:
        "master-bedroom-entry",

      roomId:
        "bedroom-1",

      side:
        "east",

      x:
        xLobby,

      y:
        bedroomEntryY,

      width:
        country === "germany"
          ? 0.90
          : 3.0,

      swing:
        "left"
    },

    {
      id:
        "bedroom-2-entry",

      roomId:
        "bedroom-2",

      side:
        "west",

      x:
        xRight,

      y:
        bedroomEntryY,

      width:
        country === "germany"
          ? 0.90
          : 3.0,

      swing:
        preferences.oppositeBedroomEntries
          ? "right"
          : "left"
    }
  ];

  /*
    SOUTH ROAD:
    mirror complete geometry vertically so living/dining remain at road side.
  */
  if (roadSide === "south") {
    mirrorAllV16(
      rooms,
      [
        verticalLobby,
        rearLanding,
        bedroomPassage
      ],
      b
    );

    for (
      const door
      of interiorDoors
    ) {
      door.y =
        roundV16(
          b.y +
          b.height -
          (
            door.y -
            b.y
          )
        );
    }
  }

  /*
    Chat-driven directional changes:
    keep them deterministic without destroying the footprint.
  */
  applyPreferenceSwapsV16(
    rooms,
    preferences,
    b
  );

  /*
    MAIN ENTRANCE + FOYER
    A normal residential plan must have an exterior entrance.
  */
  const livingRoom =
    rooms.find(
      room =>
        room.id === "living"
    );

  const entranceDoorWidth =
    country === "germany"
      ? 1.0
      : 3.5;

  const entranceMargin =
    country === "germany"
      ? 0.45
      : 1.5;

  const entranceCenterX =
    clampV16(
      xLobby -
        entranceDoorWidth * 0.15,
      livingRoom.x +
        entranceMargin +
        entranceDoorWidth / 2,
      livingRoom.x +
        livingRoom.width -
        entranceMargin -
        entranceDoorWidth / 2
    );

  const mainEntrance = {
    id: "main-entrance",
    name: "Main Entrance",
    type: "entrance",
    roomId: "living",
    side: roadSide,
    width: entranceDoorWidth,
    x: roundV16(entranceCenterX),
    y: roundV16(
      roadSide === "north"
        ? livingRoom.y
        : livingRoom.y +
          livingRoom.height
    )
  };

  const foyerDepth =
    country === "germany"
      ? 1.35
      : 4.5;

  const foyerWidth =
    country === "germany"
      ? 1.65
      : 5.5;

  const foyer = {
    id: "entry-foyer",
    name: "Entry",
    type: "foyer",

    x: roundV16(
      clampV16(
        entranceCenterX -
          foyerWidth / 2,
        livingRoom.x,
        livingRoom.x +
          livingRoom.width -
          foyerWidth
      )
    ),

    y: roundV16(
      roadSide === "north"
        ? livingRoom.y
        : livingRoom.y +
          livingRoom.height -
          foyerDepth
    ),

    width: roundV16(
      Math.min(
        foyerWidth,
        livingRoom.width
      )
    ),

    height: roundV16(
      Math.min(
        foyerDepth,
        livingRoom.height * 0.45
      )
    )
  };


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
    unit:
      profile.unit,

    roadSide,

    plot:
      areaInfo.plot,

    setbacks:
      areaInfo.setbacks,

    buildableArea:
      b,

    feasibility,

    circulation: [
      verticalLobby,
      rearLanding,
      bedroomPassage,
      foyer
    ],

    entrances: [
      mainEntrance
    ],

    interiorDoors,

    rooms,

    failedRooms: [],

    placementStrategy:
      "architectural-prompt-responsive-v18",

    statistics: {
      requestedRooms:
        rooms.length,

      placedRooms:
        rooms.length,

      failedRooms:
        0,

      roomArea:
        roundV16(roomArea),

      corridorArea:
        roundV16(
          verticalLobby.width *
          verticalLobby.height +
          rearLanding.width *
          rearLanding.height
        )
    },

    adaptations: [
      {
        type:
          "compact-circulation",

        room:
          "Whole plan",

        reason:
          "A compact central lobby and rear landing replace the previous full-height corridor."
      }
    ]
  };
}


function placeV16(
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
      roundV16(x),

    y:
      roundV16(y),

    width:
      roundV16(width),

    height:
      roundV16(height),

    area:
      roundV16(
        width *
        height
      )
  });
}


function mirrorAllV16(
  rooms,
  circulation,
  buildable
) {
  const all =
    [
      ...rooms,
      ...circulation
    ];

  for (
    const item
    of all
  ) {
    const offset =
      item.y -
      buildable.y;

    item.y =
      roundV16(
        buildable.y +
        buildable.height -
        offset -
        item.height
      );
  }
}


function applyPreferenceSwapsV16(
  rooms,
  preferences,
  buildable
) {
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
    /*
      Swap x positions only when widths are similar enough.
      This avoids breaking the connected footprint.
    */
    const oldKitchenX =
      kitchen.x;

    kitchen.x =
      dining.x;

    dining.x =
      oldKitchenX;
  }

  const master =
    rooms.find(
      room =>
        room.id === "bedroom-1"
    );

  const bed2 =
    rooms.find(
      room =>
        room.id === "bedroom-2"
    );

  const masterDirection =
    String(
      preferences.masterBedroomDirection || ""
    ).toLowerCase();

  if (
    master &&
    bed2 &&
    [
      "east",
      "northeast",
      "southeast"
    ].includes(
      masterDirection
    )
  ) {
    const mx =
      master.x;

    master.x =
      bed2.x;

    bed2.x =
      mx;
  }
}


function applySizeIntentV16(
  rooms,
  preferences
) {
  const scales =
    preferences.roomScales || {};

  /*
    This keeps the footprint connected.
    We only adjust label/intent metadata here.
    The next optimization pass can use these values
    for exact band redistribution.
  */
  for (
    const room
    of rooms
  ) {
    let scale = 1;

    if (
      room.id === "living" &&
      scales.living
    ) {
      scale =
        scales.living;
    }

    if (
      room.id === "dining" &&
      scales.dining
    ) {
      scale =
        scales.dining;
    }

    if (
      room.id === "kitchen" &&
      scales.kitchen
    ) {
      scale =
        scales.kitchen;
    }

    if (
      room.id === "bedroom-1" &&
      scales.masterBedroom
    ) {
      scale =
        scales.masterBedroom;
    }

    if (
      room.type === "bedroom" &&
      scales.bedroom
    ) {
      scale =
        scales.bedroom;
    }

    room.requestedSizeScale =
      scale;
  }
}


function normalizeRoadSideV16(
  roadSide
) {
  const value =
    String(
      roadSide ||
      "north"
    ).toLowerCase();

  return [
    "north",
    "south",
    "east",
    "west"
  ].includes(value)
    ? value
    : "north";
}


function clampV16(
  value,
  min,
  max
) {
  return Math.max(
    min,
    Math.min(
      max,
      value
    )
  );
}


function roundV16(
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
