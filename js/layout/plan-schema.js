export const DESIGN_PROFILES = {
  india: {
    unit: "ft",

    roomDefaults: {
      living: {
        minWidth: 10,
        minHeight: 11,
        preferredWidth: 12,
        preferredHeight: 14,
        zone: "public"
      },

      familyLounge: {
        minWidth: 9,
        minHeight: 10,
        preferredWidth: 11,
        preferredHeight: 12,
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
        minWidth: 6,
        minHeight: 9,
        preferredWidth: 8,
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
        preferredHeight: 13,
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
    },

    planning: {
      preferAttachedMasterBath: true,
      preferUtilityNearKitchen: true,
      allowFamilyLoungeAsCirculationHub: true,
      preferPujaNearLivingDining: true,
      wetAreasGrouped: true
    }
  },


  germany: {
    unit: "m",

    roomDefaults: {
      living: {
        minWidth: 3.0,
        minHeight: 3.5,
        preferredWidth: 3.6,
        preferredHeight: 4.5,
        zone: "public"
      },

      familyLounge: {
        minWidth: 3.0,
        minHeight: 3.2,
        preferredWidth: 3.4,
        preferredHeight: 4.0,
        zone: "semiPublic"
      },

      dining: {
        minWidth: 2.6,
        minHeight: 3.0,
        preferredWidth: 3.0,
        preferredHeight: 3.5,
        zone: "semiPublic"
      },

      kitchen: {
        minWidth: 2.4,
        minHeight: 3.0,
        preferredWidth: 2.8,
        preferredHeight: 3.5,
        zone: "service"
      },

      bedroom: {
        minWidth: 2.8,
        minHeight: 3.2,
        preferredWidth: 3.2,
        preferredHeight: 3.8,
        zone: "private"
      },

      masterBedroom: {
        minWidth: 3.0,
        minHeight: 3.5,
        preferredWidth: 3.5,
        preferredHeight: 4.0,
        zone: "private"
      },

      attachedToilet: {
        minWidth: 1.6,
        minHeight: 2.2,
        preferredWidth: 1.8,
        preferredHeight: 2.4,
        zone: "service"
      },

      commonToilet: {
        minWidth: 1.5,
        minHeight: 2.0,
        preferredWidth: 1.8,
        preferredHeight: 2.2,
        zone: "service"
      },

      utility: {
        minWidth: 1.8,
        minHeight: 2.2,
        preferredWidth: 2.2,
        preferredHeight: 2.6,
        zone: "service"
      },

      store: {
        minWidth: 1.2,
        minHeight: 1.5,
        preferredWidth: 1.5,
        preferredHeight: 2.0,
        zone: "service"
      },

      corridor: {
        minWidth: 1.0,
        preferredWidth: 1.2,
        zone: "circulation"
      }
    },

    planning: {
      preferOpenLivingDining: true,
      preferCompactWetCore: true,
      wetAreasGrouped: true,
      preferNaturalDaylightForHabitableRooms: true,
      avoidInternalBedroomsWithoutExteriorWall: true,
      accessibilityAware: true
    }
  }
};


export function getDesignProfile(country = "india") {
  const key = String(country).toLowerCase();

  return DESIGN_PROFILES[key] || DESIGN_PROFILES.india;
}


export function getDefaultBathroomPlan(bhk, country = "india") {
  const normalizedCountry = String(country).toLowerCase();

  if (normalizedCountry === "germany") {
    if (bhk <= 2) {
      return {
        attachedBathrooms: 0,
        commonBathrooms: 1
      };
    }

    if (bhk <= 4) {
      return {
        attachedBathrooms: 1,
        commonBathrooms: 1
      };
    }

    return {
      attachedBathrooms: 1,
      commonBathrooms: 2
    };
  }

  // India defaults
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
