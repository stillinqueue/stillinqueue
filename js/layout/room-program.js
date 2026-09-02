import {
  getDesignProfile,
  getDefaultBathroomPlan
} from "./plan-schema.js";


/*
  Still In Queue · Room Program V18
  ---------------------------------
  A room program is not only a list of rectangular boxes.

  Each room now carries architectural intent that the deterministic planner
  can use when a site is tight:

  - priority:
      hard       -> preserve unless the user explicitly changes the brief
      important  -> preserve before optional amenities
      flexible   -> may be compacted/combined/replanned
      optional   -> may be omitted when it was not explicitly requested

  - shapePolicy:
      rectangular -> keep a conventional rectangle when practical
      orthogonal  -> may become L-shaped / stepped / notched
      mergeable   -> may participate in a combined social zone

  - compactability:
      protected -> do not auto-compact below normal preferred dimensions
      moderate  -> may be modestly compacted, never below configured minima
      high      -> first candidate for compact-site reduction

  These are planning hints only. Explicit user dimensions and hard room
  constraints remain authoritative.
*/


function plotArea(requirements) {
  const width = Number(requirements?.plot?.width || 0);
  const height = Number(
    requirements?.plot?.height ??
    requirements?.plot?.depth ??
    0
  );

  if (!(width > 0) || !(height > 0)) return null;
  return width * height;
}


function compactSiteProfile(requirements, unit) {
  const area = plotArea(requirements);
  if (!(area > 0)) {
    return {
      isCompact: false,
      isVeryCompact: false,
      area: null
    };
  }

  /*
    These thresholds are concept-planning heuristics, NOT code/setback rules.
    They only influence preference ordering and optional-space defaults.
  */
  const areaSqFt =
    String(unit || "ft").toLowerCase() === "m"
      ? area * 10.7639
      : area;

  return {
    isCompact: areaSqFt <= 1400,
    isVeryCompact: areaSqFt <= 1150,
    area: areaSqFt
  };
}


function withPlanningIntent(room, {
  priority = "important",
  shapePolicy = "rectangular",
  compactability = "moderate",
  mayMergeWith = [],
  mayShareCirculation = true,
  protectWhenExplicit = true,
  notes = []
} = {}) {
  return {
    ...room,
    planningIntent: {
      priority,
      shapePolicy,
      compactability,
      mayMergeWith,
      mayShareCirculation,
      protectWhenExplicit,
      notes
    },

    /*
      Backward-compatible orthogonal geometry contract.
      The current planner may still emit one rectangle, while later planning
      stages/renderers can replace `parts` with multiple connected rectangles
      to represent L-shaped or stepped rooms.
    */
    shapePolicy,
    supportsCompoundShape:
      shapePolicy === "orthogonal" ||
      shapePolicy === "mergeable"
  };
}


export function buildRoomProgram(requirements) {
  const rooms = [];

  const dwellingType =
    String(
      requirements?.preferences?.dwellingType ||
      requirements?.house?.dwellingType ||
      "bhk"
    ).toLowerCase();

  const isStudio =
    ["studio", "one-room", "one_room", "1-room", "1_room"].includes(
      dwellingType
    );

  /*
    IMPORTANT:
    Studio is NOT 1BHK.

    studio / 1-room apartment:
      0 separate bedrooms
      1 combined living/sleeping room
      kitchen or kitchenette
      1 common bathroom

    1BHK:
      1 separate bedroom
      living
      kitchen
      bathroom
  */
  const bhk =
    isStudio
      ? 0
      : Math.max(
          1,
          Number(requirements.house?.bhk ?? 1)
        );

  const country = String(
    requirements.country || "india"
  ).toLowerCase();

  const preferences =
    requirements.preferences || {};

  const profile =
    getDesignProfile(country);

  const plotUnit =
    String(
      requirements.plot?.unit ||
      profile.unit ||
      "ft"
    ).toLowerCase();

  const profileUnit =
    String(
      profile.unit ||
      plotUnit
    ).toLowerCase();

  const unitFactor =
    profileUnit === plotUnit
      ? 1
      : profileUnit === "m" &&
        plotUnit === "ft"
        ? 3.28084
        : profileUnit === "ft" &&
          plotUnit === "m"
          ? 0.3048
          : 1;

  const siteProfile =
    compactSiteProfile(
      requirements,
      plotUnit
    );

  const ROOM_DEFAULTS =
    Object.fromEntries(
      Object.entries(
        profile.roomDefaults
      ).map(
        ([key, value]) => [
          key,
          {
            ...value,

            ...(value.minWidth != null
              ? {
                  minWidth:
                    value.minWidth *
                    unitFactor
                }
              : {}),

            ...(value.minHeight != null
              ? {
                  minHeight:
                    value.minHeight *
                    unitFactor
                }
              : {}),

            ...(value.preferredWidth != null
              ? {
                  preferredWidth:
                    value.preferredWidth *
                    unitFactor
                }
              : {}),

            ...(value.preferredHeight != null
              ? {
                  preferredHeight:
                    value.preferredHeight *
                    unitFactor
                }
              : {})
          }
        ]
      )
    );

  const roomScales =
    preferences.roomScales || {};

  const withScale = (
    defaults,
    scaleKey,
    fallbackScaleKey = null
  ) => {
    const scale =
      Math.max(
        0.75,
        Math.min(
          1.35,
          Number(
            roomScales[scaleKey] ||
            (fallbackScaleKey ? roomScales[fallbackScaleKey] : null) ||
            1
          )
        )
      );

    return {
      ...defaults,

      requestedSizeScale:
        Math.abs(scale - 1) > 0.001
          ? scale
          : null,

      preferredWidth:
        defaults.preferredWidth != null
          ? defaults.preferredWidth *
            scale
          : defaults.preferredWidth,

      preferredHeight:
        defaults.preferredHeight != null
          ? defaults.preferredHeight *
            scale
          : defaults.preferredHeight
    };
  };

  /*
    ---------------------------------------------------------
    BATHROOM PLAN

    Bathrooms are ALWAYS generated from either:
    1. an explicit user count, or
    2. the country/BHK practical default.

    India defaults:
      1BHK -> 1 attached
      2BHK -> 1 attached + 1 common
      3BHK -> 2 attached + 1 common
      4BHK -> 2 attached + 1 common
      5BHK -> 3 attached + 1 common

    Germany uses the defaults from plan-schema.js.

    This fixes the previous case where a 3BHK layout could
    render with no bathrooms at all.
    ---------------------------------------------------------
  */

  const defaultBathroomPlan =
    isStudio
      ? {
          attachedBathrooms: 0,
          commonBathrooms: 1
        }
      : getDefaultBathroomPlan(
          bhk,
          country
        );

  let attachedBathroomCount =
    Number.isInteger(
      preferences.attachedBathroomCount
    )
      ? preferences.attachedBathroomCount
      : defaultBathroomPlan.attachedBathrooms;

  let commonBathroomCount =
    Number.isInteger(
      preferences.commonBathroomCount
    )
      ? preferences.commonBathroomCount
      : defaultBathroomPlan.commonBathrooms;

  attachedBathroomCount =
    Math.max(
      0,
      Math.min(
        attachedBathroomCount,
        bhk
      )
    );

  commonBathroomCount =
    Math.max(
      0,
      commonBathroomCount
    );


  /*
    ---------------------------------------------------------
    PUBLIC AREA
    ---------------------------------------------------------
  */

  rooms.push(
    withPlanningIntent(
      {
        id: "living",
        name:
          isStudio
            ? "Studio Living / Sleeping"
            : preferences.combineLivingDining === true
              ? "Living / Dining"
              : "Living Room",
        type: "living",

        requiresCirculationAccess: true,

        ...withScale(
          ROOM_DEFAULTS.living,
          "living"
        )
      },
      {
        priority: "hard",
        shapePolicy: "mergeable",
        compactability: "moderate",
        mayMergeWith: ["dining", "foyer"],
        notes: [
          isStudio
            ? "This is the primary combined living/sleeping room; no separate bedroom is required."
            : "Preserve a usable public/social zone.",
          preferences.combineLivingDining === true
            ? "Dining functionality is intentionally integrated into this room."
            : "On compact sites the living room may become L-shaped or share an open-plan edge with dining."
        ]
      }
    )
  );


  /*
    ---------------------------------------------------------
    FAMILY LOUNGE

    India:
      default from 3BHK upward.

    Germany:
      not automatic.

    IMPORTANT:
      layout-planner.js is allowed to remove this room and
      retry when the plot is tight, unless the user explicitly
      requested it.
    ---------------------------------------------------------
  */

  let includeFamilyLounge;

  if (
    typeof preferences.familyLounge ===
    "boolean"
  ) {
    includeFamilyLounge =
      preferences.familyLounge;
  } else {
    /*
      A separate family lounge is a lifestyle preference, not a mandatory
      component of every Indian 3BHK.

      On compact/very compact plots, do not automatically consume floor area
      with it. The user can still explicitly request familyLounge=true, and
      that explicit request is then protected by the planner.
    */
    includeFamilyLounge =
      !isStudio &&
      country === "india" &&
      bhk >= 3 &&
      !siteProfile.isCompact;
  }

  if (
    includeFamilyLounge
  ) {
    rooms.push(
      withPlanningIntent(
        {
          id: "family-lounge",
          name: "Family Lounge",
          type: "familyLounge",

          requiresCirculationAccess: true,

          ...withScale(
            ROOM_DEFAULTS.familyLounge,
            "familyLounge"
          )
        },
        {
          priority:
            preferences.familyLounge === true
              ? "important"
              : "optional",
          shapePolicy: "mergeable",
          compactability: "high",
          mayMergeWith: ["living", "dining"],
          notes: [
            "Optional unless explicitly requested.",
            "May share an open-plan/orthogonal social zone on compact sites."
          ]
        }
      )
    );
  }


  /*
    ---------------------------------------------------------
    DINING
    ---------------------------------------------------------
  */

  if (
    !isStudio &&
    preferences.combineLivingDining !== true
  ) {
  rooms.push(
      withPlanningIntent(
        {
          id: "dining",
          name: "Dining",
          type: "dining",
  
          preferredNear: [
            "living",
            "kitchen"
          ],
  
          requiresCirculationAccess: true,
  
          ...withScale(
            ROOM_DEFAULTS.dining,
            "dining"
          )
        },
        {
          priority: "important",
          shapePolicy: "mergeable",
          compactability: "high",
          mayMergeWith: ["living", "kitchen", "family-lounge"],
          notes: [
            "Separate dining is preferred when space permits.",
            "On a compact site it may become part of an open-plan living/dining zone rather than a standalone rectangle."
          ]
        }
      )
    );
  }


  /*
    ---------------------------------------------------------
    KITCHEN
    ---------------------------------------------------------
  */

  rooms.push(
    withPlanningIntent(
      {
        id: "kitchen",
        name: "Kitchen",
        type: "kitchen",

        preferredDirection:
          preferences.kitchenDirection ||
          null,

        preferredNear:
          isStudio ||
          preferences.combineLivingDining === true
            ? ["living"]
            : ["dining"],

        requiresExteriorWall: true,
        requiresCirculationAccess: true,
        wetArea: true,

        ...withScale(
          ROOM_DEFAULTS.kitchen,
          "kitchen"
        )
      },
      {
        priority: "hard",
        shapePolicy: "orthogonal",
        compactability: "moderate",
        mayMergeWith: ["dining"],
        notes: [
          "Preserve practical worktop depth and access.",
          "May use a stepped/open-kitchen edge where that improves circulation."
        ]
      }
    )
  );


  /*
    ---------------------------------------------------------
    BEDROOMS
    ---------------------------------------------------------
  */

  for (
    let i = 1;
    i <= bhk;
    i++
  ) {
    const isMaster =
      i === 1;

    rooms.push(
      withPlanningIntent(
        {
          id:
            `bedroom-${i}`,

          name:
            isMaster
              ? "Master Bedroom"
              : `Bedroom ${i}`,

          type:
            isMaster
              ? "masterBedroom"
              : "bedroom",

          preferredDirection:
            isMaster
              ? (
                  preferences
                    .masterBedroomDirection ||
                  null
                )
              : null,

          requiresExteriorWall: true,
          requiresCirculationAccess: true,

          ...withScale(
            ROOM_DEFAULTS[
              isMaster
                ? "masterBedroom"
                : "bedroom"
            ],
            isMaster
              ? "masterBedroom"
              : `bedroom${i}`,
            isMaster
              ? null
              : "bedroom"
          )
        },
        {
          priority: "hard",
          shapePolicy: "orthogonal",
          compactability:
            isMaster
              ? "moderate"
              : "high",
          notes: [
            "Bedroom count is a hard BHK requirement.",
            isMaster
              ? "Prefer protecting the master bedroom before optional social spaces."
              : "Secondary bedrooms may be modestly compacted on tight sites but never below configured practical minima.",
            "A small entrance recess/notch is acceptable when it improves connected circulation and furniture usability."
          ]
        }
      )
    );
  }


  /*
    ---------------------------------------------------------
    ATTACHED BATHROOMS

    Attach them starting with the master bedroom.

    For a default Indian 3BHK:
      Master Bedroom -> Master Toilet
      Bedroom 2      -> Attached Toilet 2

    Bedroom 3 uses the common toilet by default.
    ---------------------------------------------------------
  */

  for (
    let i = 1;
    i <= attachedBathroomCount;
    i++
  ) {
    rooms.push(
      withPlanningIntent(
        {
          id:
            `attached-toilet-${i}`,

          name:
            i === 1
              ? "Master Toilet"
              : `Attached Toilet ${i}`,

          type:
            "attachedToilet",

          attachedTo:
            `bedroom-${i}`,

          preferredNear: [
            `bedroom-${i}`
          ],

          wetArea: true,

          /*
            It should be reached through its bedroom,
            not consume a separate corridor door.
          */
          requiresCirculationAccess: false,

          ...ROOM_DEFAULTS.attachedToilet
        },
        {
          priority: "important",
          shapePolicy: "rectangular",
          compactability: "moderate",
          mayShareCirculation: false,
          notes: [
            "Keep attached directly to its bedroom.",
            "Wet-area dimensions should remain practical even on compact sites."
          ]
        }
      )
    );
  }


  /*
    ---------------------------------------------------------
    COMMON TOILETS

    Common toilets must be reachable from circulation.
    ---------------------------------------------------------
  */

  for (
    let i = 1;
    i <= commonBathroomCount;
    i++
  ) {
    const single =
      commonBathroomCount === 1;

    rooms.push(
      withPlanningIntent(
        {
          id:
            single
              ? "common-toilet"
              : `common-toilet-${i}`,

          name:
            single
              ? "Common Toilet"
              : `Common Toilet ${i}`,

          type:
            "commonToilet",

          accessibleFromCirculation: true,
          requiresCirculationAccess: true,
          wetArea: true,

          preferredNear:
            isStudio
              ? ["living", "kitchen"]
              : [
                  "bedroom-2",
                  "bedroom-3"
                ],

          ...ROOM_DEFAULTS.commonToilet
        },
        {
          priority: "hard",
          shapePolicy: "rectangular",
          compactability: "moderate",
          notes: [
            "Must remain independently reachable from shared circulation.",
            "Prefer the private/bedroom side rather than opening directly at the main entrance."
          ]
        }
      )
    );
  }


  /*
    ---------------------------------------------------------
    UTILITY

    India:
      default for 3BHK+.

    Germany:
      only when explicitly requested.

    layout-planner.js may remove an automatically-added
    utility if the plot is too tight.
    ---------------------------------------------------------
  */

  let includeUtility;

  if (
    typeof preferences.utility ===
    "boolean"
  ) {
    includeUtility =
      preferences.utility;
  } else {
    /*
      Separate utility is useful but not essential on a compact ground-floor
      plot. On compact sites its function can be integrated into the kitchen
      unless the user explicitly asks for a utility room.
    */
    includeUtility =
      country === "india" &&
      bhk >= 3 &&
      !siteProfile.isCompact;
  }

  if (
    includeUtility
  ) {
    rooms.push(
      withPlanningIntent(
        {
          id: "utility",
          name: "Utility",
          type: "utility",

          attachedTo: "kitchen",

          preferredNear: [
            "kitchen"
          ],

          wetArea: true,
          requiresCirculationAccess: false,

          ...ROOM_DEFAULTS.utility
        },
        {
          priority:
            preferences.utility === true
              ? "important"
              : "optional",
          shapePolicy: "orthogonal",
          compactability: "high",
          mayShareCirculation: false,
          notes: [
            "Optional unless explicitly requested.",
            "On compact plots utility functions may be integrated into the kitchen/service edge."
          ]
        }
      )
    );
  }


  /*
    ---------------------------------------------------------
    PUJA ROOM
    ---------------------------------------------------------
  */

  if (
    preferences.puja === true
  ) {
    rooms.push(
      withPlanningIntent(
        {
          id: "puja",
          name: "Puja Room",
          type: "puja",

          preferredNear: [
            "living",
            "dining"
          ],

          requiresCirculationAccess: true,

          ...ROOM_DEFAULTS.puja
        },
        {
          priority: "important",
          shapePolicy: "orthogonal",
          compactability: "high",
          notes: [
            "Explicitly requested amenity; preserve it before non-requested optional rooms.",
            "May use a compact niche-like orthogonal footprint when practical."
          ]
        }
      )
    );
  }


  /*
    ---------------------------------------------------------
    STORE
    ---------------------------------------------------------
  */

  if (
    preferences.store === true
  ) {
    rooms.push(
      withPlanningIntent(
        {
          id: "store",
          name: "Store",
          type: "store",

          preferredNear: [
            "kitchen"
          ],

          requiresCirculationAccess: true,

          ...ROOM_DEFAULTS.store
        },
        {
          priority: "important",
          shapePolicy: "orthogonal",
          compactability: "high",
          notes: [
            "Explicitly requested amenity.",
            "May use a shallow/notched footprint near the kitchen rather than a large standalone rectangle."
          ]
        }
      )
    );
  }

  if (preferences.balcony === true) {
    rooms.push(
      withPlanningIntent(
        {
          id: "balcony",
          name: "Balcony",
          type: "balcony",
          attachedTo: "living",
          preferredNear: ["living"],
          requiresExteriorWall: true,
          requiresCirculationAccess: false,
          ...ROOM_DEFAULTS.balcony
        },
        {
          priority: "important",
          shapePolicy: "orthogonal",
          compactability: "high",
          mayShareCirculation: false,
          notes: [
            "Explicit exterior feature; must remain connected to an exterior edge."
          ]
        }
      )
    );
  }


  /*
    ---------------------------------------------------------
    FINAL VALIDATION

    Never allow a multi-bedroom room program to silently
    contain zero bathrooms.
    ---------------------------------------------------------
  */

  const bathroomCount =
    rooms.filter(
      room =>
        room.type ===
          "attachedToilet" ||
        room.type ===
          "commonToilet"
    ).length;

  if (
    bathroomCount === 0
  ) {
    throw new Error(
      "Room program validation failed: no bathrooms were generated."
    );
  }

  const constrainedRooms =
    applyRoomConstraints(
      rooms,
      preferences.roomConstraints,
      plotUnit
    );

  /*
    Arrays are kept for complete backward compatibility with the existing
    planner, but non-index metadata is attached for newer planning stages.
  */
  constrainedRooms.programIntent = {
    version: "room-program-v18",
    dwellingType:
      isStudio
        ? "studio"
        : "bhk",
    separateBedroomCount:
      bhk,
    integratedLivingDining:
      Boolean(
        isStudio ||
        preferences.combineLivingDining === true
      ),
    siteProfile: {
      compact: siteProfile.isCompact,
      veryCompact: siteProfile.isVeryCompact,
      plotAreaSqFt: siteProfile.area
    },
    priorities: {
      preserveFirst: [
        "bedroom-count",
        "bathrooms",
        "kitchen",
        "living",
        "circulation"
      ],
      negotiateNext: [
        "family-lounge",
        "separate-dining",
        "utility",
        "secondary-bedroom-preferred-size"
      ]
    },
    compoundGeometry: {
      enabled: true,
      allowedShapes: [
        "rectangle",
        "L-shape",
        "stepped-orthogonal",
        "notched-orthogonal"
      ],
      arbitraryDiagonalPolygons: false
    }
  };

  return constrainedRooms;
}


function applyRoomConstraints(rooms, constraints, plotUnit) {
  if (!Array.isArray(constraints) || constraints.length === 0) return rooms;

  const normalize = value => String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  const aliases = room => {
    const values = [room.id, room.name, room.type];
    if (room.id === "bedroom-1") values.push("master", "master bedroom", "masterbedroom");
    const bedroomNumber = room.id.match(/^bedroom-(\d+)$/)?.[1];
    if (bedroomNumber) values.push(`bedroom${bedroomNumber}`, `bed room ${bedroomNumber}`);
    if (room.id === "family-lounge") values.push("familyLounge", "family room", "lounge");
    if (room.id === "living") values.push("living dining", "living room");
    if (room.id === "common-toilet") values.push("common bathroom", "common washroom");
    return values.map(normalize);
  };

  const findRoom = roomText => {
    const target = normalize(roomText);
    return rooms.find(room => aliases(room).includes(target)) ||
      rooms.find(room => aliases(room).some(alias => target.includes(alias) || alias.includes(target)));
  };

  const lengthFactor = constraintUnit => {
    const source = String(constraintUnit || plotUnit).toLowerCase();
    if (source === plotUnit) return 1;
    if (source === "m" && plotUnit === "ft") return 3.28084;
    if (source === "ft" && plotUnit === "m") return 0.3048;
    return 1;
  };

  for (const constraint of constraints) {
    const room = findRoom(constraint?.room);
    if (!room) continue;

    const factor = lengthFactor(constraint.unit);
    const width = Number(constraint.width) > 0 ? Number(constraint.width) * factor : null;
    const depth = Number(constraint.depth) > 0 ? Number(constraint.depth) * factor : null;
    const rawArea = Number(constraint.area) > 0 ? Number(constraint.area) : null;
    const area = rawArea == null ? null : rawArea * factor * factor;
    const areaDelta = Number.isFinite(Number(constraint.area_delta)) && Number(constraint.area_delta) !== 0
      ? Number(constraint.area_delta) * factor * factor
      : null;
    const defaultWidth = Number(room.preferredWidth || room.minWidth);
    const defaultHeight = Number(room.preferredHeight || room.minHeight);

    let preferredWidth = width || defaultWidth;
    let preferredHeight = depth || defaultHeight;
    if (area && !width && !depth) {
      const scale = Math.sqrt(area / Math.max(1, defaultWidth * defaultHeight));
      preferredWidth = defaultWidth * scale;
      preferredHeight = defaultHeight * scale;
    } else if (area && width && !depth) {
      preferredHeight = area / width;
    } else if (area && depth && !width) {
      preferredWidth = area / depth;
    }

    room.preferredWidth = Math.max(Number(room.minWidth || 0), preferredWidth);
    room.preferredHeight = Math.max(Number(room.minHeight || 0), preferredHeight);
    room.requestedConstraint = {
      width,
      depth,
      area,
      areaDelta,
      orientationLocked: Boolean(
        constraint.orientation_locked ??
        constraint.orientationLocked ??
        false
      ),
      unit: plotUnit
    };

    room.explicitlyConstrained = true;
    room.planningIntent = {
      ...(room.planningIntent || {}),
      priority: "hard",
      protectWhenExplicit: true,
      notes: [
        ...(
          Array.isArray(room.planningIntent?.notes)
            ? room.planningIntent.notes
            : []
        ),
        "Explicit user size/area constraint: preserve this requirement ahead of automatic compacting."
      ]
    };
  }

  return rooms;
}
