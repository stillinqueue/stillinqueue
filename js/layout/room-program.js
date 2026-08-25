import { ROOM_DEFAULTS } from "./plan-schema.js";

export function buildRoomProgram(requirements) {
  const rooms = [];

  // Living room
  rooms.push({
    id: "living",
    name: "Living Room",
    type: "living",
    ...ROOM_DEFAULTS.living
  });

  // Optional family lounge
  if (requirements.preferences?.familyLounge) {
    rooms.push({
      id: "family-lounge",
      name: "Family Lounge",
      type: "familyLounge",
      ...ROOM_DEFAULTS.familyLounge
    });
  }

  // Dining
  rooms.push({
    id: "dining",
    name: "Dining",
    type: "dining",
    ...ROOM_DEFAULTS.dining
  });

  // Kitchen
  rooms.push({
    id: "kitchen",
    name: "Kitchen",
    type: "kitchen",
    preferredDirection:
      requirements.preferences?.kitchenDirection || null,
    ...ROOM_DEFAULTS.kitchen
  });

  // Bedrooms + attached toilets
  for (let i = 1; i <= requirements.house.bhk; i++) {
    const isMaster = i === 1;

    rooms.push({
      id: `bedroom-${i}`,
      name: isMaster ? "Master Bedroom" : `Bedroom ${i}`,
      type: isMaster ? "masterBedroom" : "bedroom",
      preferredDirection: isMaster
        ? requirements.preferences?.masterBedroomDirection || null
        : null,
      ...ROOM_DEFAULTS[
        isMaster ? "masterBedroom" : "bedroom"
      ]
    });

    if (requirements.preferences?.attachedBathrooms) {
      rooms.push({
        id: `toilet-${i}`,
        name: `Toilet ${i}`,
        type: "attachedToilet",
        attachedTo: `bedroom-${i}`,
        ...ROOM_DEFAULTS.attachedToilet
      });
    }
  }

  // Optional common toilet
  if (requirements.preferences?.commonToilet) {
    rooms.push({
      id: "common-toilet",
      name: "Common Toilet",
      type: "commonToilet",
      ...ROOM_DEFAULTS.commonToilet
    });
  }

  // Optional utility
  if (requirements.preferences?.utility) {
    rooms.push({
      id: "utility",
      name: "Utility",
      type: "utility",
      ...ROOM_DEFAULTS.utility
    });
  }

  // Optional puja room
  if (requirements.preferences?.puja) {
    rooms.push({
      id: "puja",
      name: "Puja Room",
      type: "puja",
      ...ROOM_DEFAULTS.puja
    });
  }

  return rooms;
}
