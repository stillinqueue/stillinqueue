import {
  getDesignProfile,
  getDefaultBathroomPlan
} from "./plan-schema.js";


export function buildRoomProgram(requirements) {
  const rooms = [];

  const bhk = Math.max(
    1,
    Number(requirements.house?.bhk || 1)
  );

  const country = String(
    requirements.country || "india"
  ).toLowerCase();

  const preferences =
    requirements.preferences || {};

  const profile =
    getDesignProfile(country);

  const ROOM_DEFAULTS =
    profile.roomDefaults;

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
    getDefaultBathroomPlan(
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

  rooms.push({
    id: "living",
    name: "Living Room",
    type: "living",

    requiresCirculationAccess: true,

    ...ROOM_DEFAULTS.living
  });


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
    includeFamilyLounge =
      country === "india" &&
      bhk >= 3;
  }

  if (
    includeFamilyLounge
  ) {
    rooms.push({
      id: "family-lounge",
      name: "Family Lounge",
      type: "familyLounge",

      requiresCirculationAccess: true,

      ...ROOM_DEFAULTS.familyLounge
    });
  }


  /*
    ---------------------------------------------------------
    DINING
    ---------------------------------------------------------
  */

  rooms.push({
    id: "dining",
    name: "Dining",
    type: "dining",

    preferredNear: [
      "living",
      "kitchen"
    ],

    requiresCirculationAccess: true,

    ...ROOM_DEFAULTS.dining
  });


  /*
    ---------------------------------------------------------
    KITCHEN
    ---------------------------------------------------------
  */

  rooms.push({
    id: "kitchen",
    name: "Kitchen",
    type: "kitchen",

    preferredDirection:
      preferences.kitchenDirection ||
      null,

    preferredNear: [
      "dining"
    ],

    requiresExteriorWall: true,
    requiresCirculationAccess: true,
    wetArea: true,

    ...ROOM_DEFAULTS.kitchen
  });


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

    rooms.push({
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

      ...ROOM_DEFAULTS[
        isMaster
          ? "masterBedroom"
          : "bedroom"
      ]
    });
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
    rooms.push({
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
    });
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

    rooms.push({
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

      /*
        Prefer the common bathroom near bedroom/private
        circulation, not beside the front entrance.
      */
      preferredNear: [
        "bedroom-2",
        "bedroom-3"
      ],

      ...ROOM_DEFAULTS.commonToilet
    });
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
    includeUtility =
      country === "india" &&
      bhk >= 3;
  }

  if (
    includeUtility
  ) {
    rooms.push({
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
    });
  }


  /*
    ---------------------------------------------------------
    PUJA ROOM
    ---------------------------------------------------------
  */

  if (
    preferences.puja === true
  ) {
    rooms.push({
      id: "puja",
      name: "Puja Room",
      type: "puja",

      preferredNear: [
        "living",
        "dining"
      ],

      requiresCirculationAccess: true,

      ...ROOM_DEFAULTS.puja
    });
  }


  /*
    ---------------------------------------------------------
    STORE
    ---------------------------------------------------------
  */

  if (
    preferences.store === true
  ) {
    rooms.push({
      id: "store",
      name: "Store",
      type: "store",

      preferredNear: [
        "kitchen"
      ],

      requiresCirculationAccess: true,

      ...ROOM_DEFAULTS.store
    });
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


  return rooms;
}
