import {
  calculateBuildableArea
} from "./buildable-area.js";


export function createPlanningZones(requirements) {
  const areaInfo =
    calculateBuildableArea(requirements);

  const buildable =
    areaInfo.buildable;

  const country = String(
    requirements.country || "india"
  ).toLowerCase();

  const roadSide = String(
    requirements.plot?.roadSide || "north"
  ).toLowerCase();

  /*
    ---------------------------------------------------------
    BASIC ZONE RATIOS

    These are planning defaults, not legal rules.

    India:
    slightly stronger family / semi-public middle zone.

    Germany:
    slightly stronger public/open-living zone
    and compact service core.
    ---------------------------------------------------------
  */

  const ratios =
    country === "germany"
      ? {
          public: 0.30,
          semiPublic: 0.20,
          private: 0.38,
          service: 0.12
        }
      : {
          public: 0.24,
          semiPublic: 0.24,
          private: 0.40,
          service: 0.12
        };


  /*
    ---------------------------------------------------------
    NORTH / SOUTH ROAD

    For the first version, we create horizontal bands.

    Example north road:

    ROAD
    PUBLIC
    SEMI-PUBLIC
    PRIVATE
    ---------------------------------------------------------
  */

  if (
    roadSide === "north" ||
    roadSide === "south"
  ) {
    return createHorizontalZones(
      buildable,
      ratios,
      roadSide,
      country
    );
  }


  /*
    ---------------------------------------------------------
    EAST / WEST ROAD

    Create vertical bands.
    ---------------------------------------------------------
  */

  return createVerticalZones(
    buildable,
    ratios,
    roadSide,
    country
  );
}


function createHorizontalZones(
  buildable,
  ratios,
  roadSide,
  country
) {
  const {
    x,
    y,
    width,
    height
  } = buildable;

  const publicHeight =
    height * ratios.public;

  const semiPublicHeight =
    height * ratios.semiPublic;

  const privateHeight =
    height * ratios.private;

  /*
    Service zone is not necessarily one full band.
    For this MVP we reserve a side strip.
  */

  const serviceWidth =
    width * ratios.service;

  const usableWidth =
    width - serviceWidth;

  /*
    Corridor width:
    India approx 4 ft
    Germany approx 1.2 m
  */

  const corridorWidth =
    country === "germany"
      ? Math.min(1.2, usableWidth * 0.16)
      : Math.min(4, usableWidth * 0.16);


  /*
    NORTH-FACING ROAD
  */

  if (roadSide === "north") {
    const publicZone = {
      id: "zone-public",
      type: "public",

      x,
      y,

      width: usableWidth,
      height: publicHeight
    };

    const semiPublicZone = {
      id: "zone-semi-public",
      type: "semiPublic",

      x,
      y: y + publicHeight,

      width: usableWidth,
      height: semiPublicHeight
    };

    const privateZone = {
      id: "zone-private",
      type: "private",

      x,
      y:
        y +
        publicHeight +
        semiPublicHeight,

      width: usableWidth,
      height:
        height -
        publicHeight -
        semiPublicHeight
    };

    const serviceZone = {
      id: "zone-service",
      type: "service",

      x:
        x +
        usableWidth,

      y,

      width: serviceWidth,
      height
    };

    const circulationZone =
      createVerticalCirculationSpine(
        x,
        y,
        usableWidth,
        height,
        corridorWidth
      );

    return {
      orientation: "horizontal",
      roadSide,

      zones: {
        public: publicZone,
        semiPublic: semiPublicZone,
        private: privateZone,
        service: serviceZone,
        circulation:
          circulationZone
      }
    };
  }


  /*
    SOUTH-FACING ROAD

    Reverse the band order.
  */

  const privateZone = {
    id: "zone-private",
    type: "private",

    x,
    y,

    width: usableWidth,

    height:
      height -
      publicHeight -
      semiPublicHeight
  };

  const semiPublicZone = {
    id: "zone-semi-public",
    type: "semiPublic",

    x,
    y:
      y +
      privateZone.height,

    width: usableWidth,
    height: semiPublicHeight
  };

  const publicZone = {
    id: "zone-public",
    type: "public",

    x,
    y:
      y +
      privateZone.height +
      semiPublicHeight,

    width: usableWidth,
    height: publicHeight
  };

  const serviceZone = {
    id: "zone-service",
    type: "service",

    x:
      x +
      usableWidth,

    y,

    width: serviceWidth,
    height
  };

  const circulationZone =
    createVerticalCirculationSpine(
      x,
      y,
      usableWidth,
      height,
      corridorWidth
    );

  return {
    orientation: "horizontal",
    roadSide,

    zones: {
      public: publicZone,
      semiPublic: semiPublicZone,
      private: privateZone,
      service: serviceZone,
      circulation:
        circulationZone
    }
  };
}


function createVerticalZones(
  buildable,
  ratios,
  roadSide,
  country
) {
  const {
    x,
    y,
    width,
    height
  } = buildable;

  const publicWidth =
    width * ratios.public;

  const semiPublicWidth =
    width * ratios.semiPublic;

  const serviceHeight =
    height * ratios.service;

  const usableHeight =
    height - serviceHeight;

  const corridorWidth =
    country === "germany"
      ? Math.min(
          1.2,
          usableHeight * 0.16
        )
      : Math.min(
          4,
          usableHeight * 0.16
        );


  /*
    WEST-FACING ROAD
  */

  if (roadSide === "west") {
    const publicZone = {
      id: "zone-public",
      type: "public",

      x,
      y,

      width: publicWidth,
      height: usableHeight
    };

    const semiPublicZone = {
      id: "zone-semi-public",
      type: "semiPublic",

      x:
        x +
        publicWidth,

      y,

      width: semiPublicWidth,
      height: usableHeight
    };

    const privateZone = {
      id: "zone-private",
      type: "private",

      x:
        x +
        publicWidth +
        semiPublicWidth,

      y,

      width:
        width -
        publicWidth -
        semiPublicWidth,

      height: usableHeight
    };

    const serviceZone = {
      id: "zone-service",
      type: "service",

      x,
      y:
        y +
        usableHeight,

      width,
      height: serviceHeight
    };

    const circulationZone =
      createHorizontalCirculationSpine(
        x,
        y,
        width,
        usableHeight,
        corridorWidth
      );

    return {
      orientation: "vertical",
      roadSide,

      zones: {
        public: publicZone,
        semiPublic: semiPublicZone,
        private: privateZone,
        service: serviceZone,
        circulation:
          circulationZone
      }
    };
  }


  /*
    EAST-FACING ROAD

    Reverse the band order.
  */

  const privateZone = {
    id: "zone-private",
    type: "private",

    x,
    y,

    width:
      width -
      publicWidth -
      semiPublicWidth,

    height: usableHeight
  };

  const semiPublicZone = {
    id: "zone-semi-public",
    type: "semiPublic",

    x:
      x +
      privateZone.width,

    y,

    width: semiPublicWidth,
    height: usableHeight
  };

  const publicZone = {
    id: "zone-public",
    type: "public",

    x:
      x +
      privateZone.width +
      semiPublicWidth,

    y,

    width: publicWidth,
    height: usableHeight
  };

  const serviceZone = {
    id: "zone-service",
    type: "service",

    x,
    y:
      y +
      usableHeight,

    width,
    height: serviceHeight
  };

  const circulationZone =
    createHorizontalCirculationSpine(
      x,
      y,
      width,
      usableHeight,
      corridorWidth
    );

  return {
    orientation: "vertical",
    roadSide,

    zones: {
      public: publicZone,
      semiPublic: semiPublicZone,
      private: privateZone,
      service: serviceZone,
      circulation:
        circulationZone
    }
  };
}


function createVerticalCirculationSpine(
  x,
  y,
  width,
  height,
  corridorWidth
) {
  return {
    id: "zone-circulation",
    type: "circulation",

    x:
      x +
      width / 2 -
      corridorWidth / 2,

    y,

    width: corridorWidth,
    height
  };
}


function createHorizontalCirculationSpine(
  x,
  y,
  width,
  height,
  corridorWidth
) {
  return {
    id: "zone-circulation",
    type: "circulation",

    x,

    y:
      y +
      height / 2 -
      corridorWidth / 2,

    width,
    height: corridorWidth
  };
}
