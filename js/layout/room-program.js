import {
  ROOM_DEFAULTS,
  getDefaultBathroomPlan
} from "./plan-schema.js";


export function buildRoomProgram(requirements) {
  const rooms = [];

  const bhk = Number(requirements.house?.bhk || 1);

  const preferences = requirements.preferences || {};

  /*
    Bathroom defaults can be overridden later
    by explicit user preferences.
  */
  const defaultBathroomPlan = getDefaultBathroomPlan(bhk);

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
    PUBLIC AREA
    ---------------------------------------------------------
  */

  rooms.push({
    id: "living",
    name: "Living Room",
    type: "living",
    ...ROOM_DEFAULTS.living
  });


  /*
    Family lounge is useful mainly for larger houses.
    If user explicitly sets familyLounge, respect it.
    Otherwise default to true for 3BHK and above.
  */
  const includeFamilyLounge =
    typeof preferences.familyLounge === "boolean"
      ? preferences.familyLounge
      : bhk >= 3;

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
    DINING + KITCHEN
    ---------------------------------------------------------
  */

  rooms.push({
    id: "dining",
    name: "Dining",
    type: "dining",
    ...ROOM_DEFAULTS.dining
  });

  rooms.push({
    id: "kitchen",
    name: "Kitchen",
    type: "kitchen",

    preferredDirection:
      preferences.kitchenDirection || null,

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

      ...ROOM_DEFAULTS[
        isMaster ? "masterBedroom" : "bedroom"
      ]
    });
  }


  /*
    ---------------------------------------------------------
    ATTACHED BATHROOMS

    Attach bathrooms to the first bedrooms by default:
    Bedroom 1 = Master
    Bedroom 2 = second preferred attached bathroom
    etc.
    ---------------------------------------------------------
  */

  const safeAttachedCount =
    Math.min(attachedBathroomCount, bhk);

  for (let i = 1; i <= safeAttachedCount; i++) {
    rooms.push({
      id: `attached-toilet-${i}`,

      name:
        i === 1
          ? "Master Toilet"
          : `Attached Toilet ${i}`,

      type: "attachedToilet",

      attachedTo: `bedroom-${i}`,

      ...ROOM_DEFAULTS.attachedToilet
    });
  }


  /*
    ---------------------------------------------------------
    COMMON BATHROOMS
    ---------------------------------------------------------
  */

  for (let i = 1; i <= commonBathroomCount; i++) {
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

      ...ROOM_DEFAULTS.commonToilet
    });
  }


  /*
    ---------------------------------------------------------
    OPTIONAL UTILITY

    Default:
    - included for 3BHK+
    - user can explicitly turn it off
    ---------------------------------------------------------
  */

  const includeUtility =
    typeof preferences.utility === "boolean"
      ? preferences.utility
      : bhk >= 3;

  if (includeUtility) {
    rooms.push({
      id: "utility",
      name: "Utility",
      type: "utility",
      attachedTo: "kitchen",
      ...ROOM_DEFAULTS.utility
    });
  }


  /*
    ---------------------------------------------------------
    OPTIONAL PUJA ROOM
    ---------------------------------------------------------
  */

  if (preferences.puja === true) {
    rooms.push({
      id: "puja",
      name: "Puja Room",
      type: "puja",
      ...ROOM_DEFAULTS.puja
    });
  }


  /*
    ---------------------------------------------------------
    OPTIONAL STORE ROOM
    ---------------------------------------------------------
  */

  if (preferences.store === true) {
    rooms.push({
      id: "store",
      name: "Store",
      type: "store",
      ...ROOM_DEFAULTS.store
    });
  }


  return rooms;
}
