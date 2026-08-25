import {
  getDesignProfile,
  getDefaultBathroomPlan
} from "./plan-schema.js";

export function buildRoomProgram(requirements) {
  const rooms = [];

  const bhk = Number(requirements.house?.bhk || 1);
  const country = String(requirements.country || "india").toLowerCase();
  const preferences = requirements.preferences || {};

  const profile = getDesignProfile(country);
  const ROOM_DEFAULTS = profile.roomDefaults;

  const defaultBathroomPlan =
    getDefaultBathroomPlan(bhk, country);

  const attachedBathroomCount =
    Number.isInteger(preferences.attachedBathroomCount)
      ? preferences.attachedBathroomCount
      : defaultBathroomPlan.attachedBathrooms;

  const commonBathroomCount =
    Number.isInteger(preferences.commonBathroomCount)
      ? preferences.commonBathroomCount
      : defaultBathroomPlan.commonBathrooms;

  /*
    ---------------------------------------------------------
    LIVING
    ---------------------------------------------------------
  */

  rooms.push({
    id: "living",
    name: "Living Room",
    type: "living",
    ...ROOM_DEFAULTS.living
  });

  /*
    ---------------------------------------------------------
    FAMILY LOUNGE

    India:
    Default for 3BHK and above.

    Germany:
    Usually avoid automatically adding a separate family
    lounge unless the user explicitly requests it.
    ---------------------------------------------------------
  */

  let includeFamilyLounge;

  if (typeof preferences.familyLounge === "boolean") {
    includeFamilyLounge = preferences.familyLounge;
  } else {
    includeFamilyLounge =
      country === "india" && bhk >= 3;
  }

  if (includeFamilyLounge) {
    rooms.push({
      id: "family-lounge",
      name: "Family Lounge",
      type: "familyLounge",
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
      preferences.kitchenDirection || null,

    preferredNear: ["dining"],

    ...ROOM_DEFAULTS.kitchen
  });

  /*
    ---------------------------------------------------------
    BEDROOMS
    ---------------------------------------------------------
  */

  for (let i = 1; i <= bhk; i++) {
    const isMaster = i === 1;

    rooms.push({
      id: `bedroom-${i}`,

      name: isMaster
        ? "Master Bedroom"
        : `Bedroom ${i}`,

      type: isMaster
        ? "masterBedroom"
        : "bedroom",

      preferredDirection:
        isMaster
          ? preferences.masterBedroomDirection || null
          : null,

      requiresExteriorWall: true,

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

    By default, attach them beginning with the master bedroom.

    Example:
    4BHK India default:
    Master Bedroom -> Master Toilet
    Bedroom 2      -> Attached Toilet 2
    Bedroom 3      -> no attached toilet
    Bedroom 4      -> no attached toilet
    ---------------------------------------------------------
  */

  const safeAttachedBathroomCount =
    Math.max(
      0,
      Math.min(attachedBathroomCount, bhk)
    );

  for (
    let i = 1;
    i <= safeAttachedBathroomCount;
    i++
  ) {
    rooms.push({
      id: `attached-toilet-${i}`,

      name:
        i === 1
          ? "Master Toilet"
          : `Attached Toilet ${i}`,

      type: "attachedToilet",

      attachedTo: `bedroom-${i}`,

      preferredNear: [`bedroom-${i}`],

      wetArea: true,

      ...ROOM_DEFAULTS.attachedToilet
    });
  }

  /*
    ---------------------------------------------------------
    COMMON BATHROOMS
    ---------------------------------------------------------
  */

  for (
    let i = 1;
    i <= commonBathroomCount;
    i++
  ) {
    rooms.push({
      id:
        commonBathroomCount === 1
          ? "common-toilet"
          : `common-toilet-${i}`,

      name:
        commonBathroomCount === 1
          ? "Common Toilet"
          : `Common Toilet ${i}`,

      type: "commonToilet",

      accessibleFromCirculation: true,

      wetArea: true,

      ...ROOM_DEFAULTS.commonToilet
    });
  }

  /*
    ---------------------------------------------------------
    UTILITY

    India:
    Usually useful from 3BHK upwards.

    Germany:
    Do not automatically add it unless explicitly requested.
    ---------------------------------------------------------
  */

  let includeUtility;

  if (typeof preferences.utility === "boolean") {
    includeUtility = preferences.utility;
  } else {
    includeUtility =
      country === "india" && bhk >= 3;
  }

  if (includeUtility) {
    rooms.push({
      id: "utility",
      name: "Utility",
      type: "utility",

      attachedTo: "kitchen",
      preferredNear: ["kitchen"],
      wetArea: true,

      ...ROOM_DEFAULTS.utility
    });
  }

  /*
    ---------------------------------------------------------
    PUJA ROOM

    Mainly an India-oriented preference.
    Never automatically add it.
    ---------------------------------------------------------
  */

  if (preferences.puja === true) {
    rooms.push({
      id: "puja",
      name: "Puja Room",
      type: "puja",

      preferredNear: [
        "living",
        "dining"
      ],

      ...ROOM_DEFAULTS.puja
    });
  }

  /*
    ---------------------------------------------------------
    STORE
    ---------------------------------------------------------
  */

  if (preferences.store === true) {
    rooms.push({
      id: "store",
      name: "Store",
      type: "store",

      preferredNear: ["kitchen"],

      ...ROOM_DEFAULTS.store
    });
  }

  /*
    ---------------------------------------------------------
    CIRCULATION REQUIREMENTS

    We are not creating the corridor rectangle yet.

    For now, this tells the future layout planner which
    spaces must be accessible from normal circulation.
    ---------------------------------------------------------
  */

  for (const room of rooms) {
    if (
      room.type === "attachedToilet" ||
      room.type === "utility"
    ) {
      continue;
    }

    room.requiresCirculationAccess = true;
  }

  return rooms;
}
