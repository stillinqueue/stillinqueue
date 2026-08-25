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


export function generateLayout(requirements) {
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

    If the plan is tight and ANY required room cannot be
    placed, remove the automatically-added family lounge and
    retry, unless the user explicitly requested that lounge.

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
    result.feasibility?.status === "tight" &&
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

    If the compact retry still cannot place all required rooms
    and utility was only added by default, remove it and retry.
    ---------------------------------------------------------
  */

  const utilityExplicit =
    typeof preferences.utility === "boolean";

  const stillHasFailedRooms =
    Array.isArray(result.failedRooms) &&
    result.failedRooms.length > 0;

  if (
    result.feasibility?.status === "tight" &&
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
    3. PLACEMENT ORDER
    ---------------------------------------------------------
  */

  const orderedRooms =
    [...rooms].sort(
      (a, b) =>
        getPlacementPriority(a) -
        getPlacementPriority(b)
    );

  const placedRooms = [];
  const failedRooms = [];

  /*
    ---------------------------------------------------------
    4. PLACE ROOMS
    ---------------------------------------------------------
  */

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
        placedRooms
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

    case "kitchen":
      return 30;

    case "dining":
      return 35;

    case "familyLounge":
      return 40;

    case "attachedToilet":
      return 50;

    case "commonToilet":
      return 55;

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
  placedRooms
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
              size.type
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
  sizeType
}) {
  let score = 0;

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
