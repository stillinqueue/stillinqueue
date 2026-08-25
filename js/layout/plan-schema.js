export const ROOM_DEFAULTS = {
  living: {
    minWidth: 11,
    minHeight: 13,
    preferredWidth: 13,
    preferredHeight: 15,
    zone: "public"
  },

  familyLounge: {
    minWidth: 10,
    minHeight: 11,
    preferredWidth: 11,
    preferredHeight: 13,
    zone: "semiPublic"
  },

  dining: {
    minWidth: 8,
    minHeight: 9,
    preferredWidth: 9,
    preferredHeight: 10,
    zone: "semiPublic"
  },

  kitchen: {
    minWidth: 8,
    minHeight: 8,
    preferredWidth: 9,
    preferredHeight: 10,
    zone: "service"
  },

  bedroom: {
    minWidth: 9,
    minHeight: 10,
    preferredWidth: 10,
    preferredHeight: 11,
    zone: "private"
  },

  masterBedroom: {
    minWidth: 10,
    minHeight: 11,
    preferredWidth: 11,
    preferredHeight: 12,
    zone: "private"
  },

  attachedToilet: {
    minWidth: 4,
    minHeight: 6,
    preferredWidth: 5,
    preferredHeight: 7,
    zone: "service"
  },

  commonToilet: {
    minWidth: 4,
    minHeight: 6,
    preferredWidth: 5,
    preferredHeight: 7,
    zone: "service"
  },

  utility: {
    minWidth: 4,
    minHeight: 5,
    preferredWidth: 5,
    preferredHeight: 7,
    zone: "service"
  },

  puja: {
    minWidth: 4,
    minHeight: 4,
    preferredWidth: 5,
    preferredHeight: 5,
    zone: "semiPublic"
  },

  store: {
    minWidth: 3,
    minHeight: 4,
    preferredWidth: 4,
    preferredHeight: 5,
    zone: "service"
  },

  corridor: {
    minWidth: 3.5,
    preferredWidth: 4,
    zone: "circulation"
  }
};


/*
  Practical default bathroom distribution.

  These are defaults only.
  Later the user can override them.
*/
export function getDefaultBathroomPlan(bhk) {
  if (bhk <= 1) {
    return {
      attachedBathrooms: 1,
      commonBathrooms: 0
    };
  }

  if (bhk === 2) {
    return {
      attachedBathrooms: 1,
      commonBathrooms: 1
    };
  }

  if (bhk === 3) {
    return {
      attachedBathrooms: 2,
      commonBathrooms: 1
    };
  }

  if (bhk === 4) {
    return {
      attachedBathrooms: 2,
      commonBathrooms: 1
    };
  }

  if (bhk === 5) {
    return {
      attachedBathrooms: 3,
      commonBathrooms: 1
    };
  }

  return {
    attachedBathrooms: Math.ceil(bhk / 2),
    commonBathrooms: 1
  };
}
