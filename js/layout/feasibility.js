import {
  buildRoomProgram
} from "./room-program.js";

import {
  calculateBuildableArea
} from "./buildable-area.js";

import {
  PLANNING_ROOM_POLICIES
} from "./plan-schema.js";


/*
  Still In Queue · Feasibility V17
  --------------------------------
  A room is no longer assumed to be one perfect rectangle.

  Supported room geometry:
  - legacy rectangle: x / y / width / height
  - orthogonal compound room:
      room.architecturalShape.parts = [
        { x, y, width, height },
        ...
      ]

  Compound parts must form one connected orthogonal room. Validation uses
  the actual parts for overlap/bounds/area checks while remaining completely
  backward compatible with existing rectangular layouts.
*/


export function checkPlanFeasibility(requirements) {
  const country =
    String(
      requirements.country ||
      "india"
    ).toLowerCase();

  const roomProgram =
    buildRoomProgram(
      requirements
    );

  const areaInfo =
    calculateBuildableArea(
      requirements
    );

  const unit =
    String(
      requirements.plot?.unit ||
      areaInfo.plot?.unit ||
      "ft"
    ).toLowerCase();

  let minimumRoomArea = 0;
  let preferredRoomArea = 0;

  const roomBreakdown = [];

  for (
    const room
    of roomProgram
  ) {
    const minWidth =
      Number(
        room.minWidth || 0
      );

    const minHeight =
      Number(
        room.minHeight || 0
      );

    const preferredWidth =
      Number(
        room.preferredWidth ||
        room.minWidth ||
        0
      );

    const preferredHeight =
      Number(
        room.preferredHeight ||
        room.minHeight ||
        0
      );

    const minArea =
      minWidth *
      minHeight;

    const preferredArea =
      preferredWidth *
      preferredHeight;

    minimumRoomArea +=
      minArea;

    preferredRoomArea +=
      preferredArea;

    roomBreakdown.push({
      id:
        room.id,

      name:
        room.name,

      type:
        room.type,

      priority:
        room.planningIntent?.priority ||
        "important",

      shapePolicy:
        room.shapePolicy ||
        room.planningIntent?.shapePolicy ||
        "rectangular",

      compactability:
        room.planningIntent?.compactability ||
        "moderate",

      minimumArea:
        round(minArea),

      preferredArea:
        round(
          preferredArea
        )
    });
  }

  /*
    V17: circulation/wall overhead is still useful as a quick preflight,
    but compact sites get a small efficiency allowance because orthogonal
    connected rooms can share social/circulation edges more efficiently
    than independent rectangular boxes.
  */
  const siteIntent =
    roomProgram.programIntent?.siteProfile ||
    {};

  const compactEfficiency =
    siteIntent.compact
      ? 0.02
      : 0;

  const circulationFactor =
    Math.max(
      0.08,
      (
        country === "germany"
          ? 0.14
          : 0.12
      ) - compactEfficiency
    );

  const wallFactor =
    country === "germany"
      ? 0.12
      : 0.10;

  const estimatedMinimumArea =
    minimumRoomArea *
    (
      1 +
      circulationFactor +
      wallFactor
    );

  const estimatedPreferredArea =
    preferredRoomArea *
    (
      1 +
      circulationFactor +
      wallFactor
    );

  const availableArea =
    areaInfo.buildable.area;

  let status;

  if (
    availableArea >=
    estimatedPreferredArea
  ) {
    status =
      "comfortable";
  } else if (
    availableArea >=
    estimatedMinimumArea
  ) {
    status =
      "tight";
  } else {
    status =
      "infeasible";
  }

  const warnings = [];
  const tradeoffs = [];

  if (
    status === "tight"
  ) {
    warnings.push(
      "The requested plan fits only with compact room dimensions or more efficient connected/orthogonal room geometry."
    );

    tradeoffs.push(
      "Combine living and dining into one connected social zone if needed.",
      "Protect bedrooms and bathrooms before non-requested optional rooms.",
      "Use L-shaped or stepped orthogonal room footprints where that improves circulation."
    );
  }

  if (
    status === "infeasible"
  ) {
    warnings.push(
      "The full preferred room program exceeds the quick buildable-area preflight. A practical architectural trade-off or compact replan is required before declaring the site impossible."
    );

    tradeoffs.push(
      "Remove non-requested optional rooms such as a separate family lounge or utility.",
      "Compact flexible secondary bedrooms while preserving configured minimums.",
      "Combine living/dining or use orthogonal compound room geometry.",
      "Re-test the reduced program with the deterministic planner."
    );
  }

  return {
    country,
    unit,
    status,

    geometryModel: {
      version: "orthogonal-v1",
      supportsCompoundRooms: true
    },

    buildableArea: {
      width:
        areaInfo.buildable.width,

      height:
        areaInfo.buildable.height,

      area:
        areaInfo.buildable.area
    },

    roomArea: {
      minimum:
        round(
          minimumRoomArea
        ),

      preferred:
        round(
          preferredRoomArea
        )
    },

    estimatedRequiredArea: {
      minimum:
        round(
          estimatedMinimumArea
        ),

      preferred:
        round(
          estimatedPreferredArea
        )
    },

    usage: {
      minimumPercent:
        availableArea > 0
          ? round(
              (
                estimatedMinimumArea /
                availableArea
              ) *
              100
            )
          : null,

      preferredPercent:
        availableArea > 0
          ? round(
              (
                estimatedPreferredArea /
                availableArea
              ) *
              100
            )
          : null
    },

    rooms:
      roomBreakdown,

    warnings,
    tradeoffs
  };
}


export function validateGeneratedLayout(layout) {
  const rooms =
    Array.isArray(layout?.rooms)
      ? layout.rooms
      : [];

  const buildable =
    layout?.buildableArea;

  const tolerance =
    0.15;

  const errors = [];

  const roomGeometries =
    rooms.map(room => ({
      room,
      parts: roomParts(room),
      bounds: roomBounds(room),
      area: roomArea(room)
    }));


  /*
    ---------------------------------------------------------
    ROOM-TO-ROOM OVERLAP

    Parts belonging to the SAME room are allowed to touch/overlap because
    they are one compound orthogonal room. Only intersections between
    different rooms are layout collisions.
    ---------------------------------------------------------
  */

  const overlaps = [];

  roomGeometries.forEach(
    (
      first,
      index
    ) => {
      for (
        const second
        of roomGeometries.slice(
          index + 1
        )
      ) {
        if (
          geometriesOverlap(
            first.parts,
            second.parts,
            tolerance
          )
        ) {
          overlaps.push([
            first.room.id,
            second.room.id
          ]);
        }
      }
    }
  );

  if (
    overlaps.length
  ) {
    errors.push(
      "room-overlap"
    );
  }


  /*
    ---------------------------------------------------------
    BUILDABLE CONTAINMENT
    ---------------------------------------------------------
  */

  const outOfBounds =
    buildable
      ? roomGeometries
          .filter(({ parts }) =>
            parts.some(part =>
              !rectangleInside(
                part,
                buildable,
                tolerance
              )
            )
          )
          .map(item => item.room)
      : rooms;

  if (
    outOfBounds.length
  ) {
    errors.push(
      "room-out-of-bounds"
    );
  }


  /*
    ---------------------------------------------------------
    COMPOUND SHAPE CONNECTIVITY

    An L-shaped room must still be ONE room. Disconnected islands are not
    accepted merely because they share the same room id.
    ---------------------------------------------------------
  */

  const disconnectedCompoundRooms =
    roomGeometries
      .filter(({ parts }) =>
        parts.length > 1 &&
        !partsFormConnectedShape(
          parts,
          tolerance
        )
      )
      .map(item => item.room);

  if (
    disconnectedCompoundRooms.length
  ) {
    errors.push(
      "compound-room-disconnected"
    );
  }


  /*
    ---------------------------------------------------------
    MINIMUM USABILITY

    Rectangle:
      retain the old width/depth check.

    Compound room:
      validate actual area + overall usable envelope instead of requiring
      every notch to equal the minimum room width/depth.
    ---------------------------------------------------------
  */

  const belowMinimum =
    roomGeometries
      .filter(({
        room,
        parts,
        bounds,
        area
      }) => {
        const minWidth =
          Number(
            room.minWidth || 0
          );

        const minHeight =
          Number(
            room.minHeight || 0
          );

        if (
          !(minWidth > 0) ||
          !(minHeight > 0)
        ) {
          return false;
        }

        if (
          parts.length <= 1
        ) {
          const normalOrientation =
            bounds.width +
              tolerance >=
              minWidth &&
            bounds.height +
              tolerance >=
              minHeight;

          const rotatedOrientation =
            bounds.width +
              tolerance >=
              minHeight &&
            bounds.height +
              tolerance >=
              minWidth;

          return !(
            normalOrientation ||
            rotatedOrientation
          );
        }

        const minimumArea =
          minWidth *
          minHeight;

        const areaOkay =
          area +
            tolerance >=
          minimumArea *
            0.94;

        const envelopeOkay =
          (
            bounds.width +
              tolerance >=
              minWidth &&
            bounds.height +
              tolerance >=
              minHeight
          ) ||
          (
            bounds.width +
              tolerance >=
              minHeight &&
            bounds.height +
              tolerance >=
              minWidth
          );

        const unit =
          String(
            layout?.unit ||
            layout?.plot?.unit ||
            "ft"
          ).toLowerCase();

        const minimumNeck =
          unit === "m"
            ? 0.90
            : 3.0;

        const neckOkay =
          parts.every(part =>
            Math.min(
              part.width,
              part.height
            ) +
              tolerance >=
            Math.min(
              minimumNeck,
              Math.min(
                minWidth || minimumNeck,
                minHeight || minimumNeck
              )
            )
          );

        return !(
          areaOkay &&
          envelopeOkay &&
          neckOkay
        );
      })
      .map(item => item.room);

  if (
    belowMinimum.length
  ) {
    errors.push(
      "room-below-minimum"
    );
  }


  /*
    ---------------------------------------------------------
    PRACTICAL ASPECT RATIO

    For a compound room, use the whole orthogonal envelope. This prevents
    extreme ribbon rooms while allowing a normal L-shaped living/dining zone.
    ---------------------------------------------------------
  */

  const awkwardAspectRatios =
    roomGeometries
      .filter(({ bounds }) => {
        if (
          !(bounds.width > 0) ||
          !(bounds.height > 0)
        ) {
          return true;
        }

        return (
          Math.max(
            bounds.width /
              bounds.height,
            bounds.height /
              bounds.width
          ) >
          PLANNING_ROOM_POLICIES
            .maximumAspectRatio
        );
      })
      .map(item => item.room);

  if (
    awkwardAspectRatios.length
  ) {
    errors.push(
      "room-aspect-ratio-impractical"
    );
  }


  /*
    ---------------------------------------------------------
    PASSAGE WIDTH
    ---------------------------------------------------------
  */

  const plotUnit =
    String(
      layout?.unit ||
      layout?.plot?.unit ||
      "ft"
    ).toLowerCase();

  const minimumPassageWidth =
    plotUnit === "m"
      ? PLANNING_ROOM_POLICIES
          .minimumPassageWidthFt *
        0.3048
      : PLANNING_ROOM_POLICIES
          .minimumPassageWidthFt;

  const narrowPassages =
    (
      layout?.circulation ||
      []
    ).filter(item =>
      Math.min(
        item.width,
        item.height
      ) +
        tolerance <
      minimumPassageWidth
    );

  if (
    narrowPassages.length
  ) {
    errors.push(
      "passage-below-practical-minimum"
    );
  }


  /*
    ---------------------------------------------------------
    EXTERIOR WALL REQUIREMENTS
    ---------------------------------------------------------
  */

  const exteriorOpeningErrors =
    buildable
      ? rooms.filter(room => {
          if (
            !room.requiresExteriorWall
          ) {
            return false;
          }

          return !roomTouchesExterior(
            room,
            buildable,
            tolerance
          );
        })
      : [];

  if (
    exteriorOpeningErrors.length
  ) {
    errors.push(
      "required-exterior-opening-unavailable"
    );
  }


  /*
    ---------------------------------------------------------
    ATTACHED TOILET CONNECTION
    ---------------------------------------------------------
  */

  const attachedToiletErrors =
    rooms.filter(room => {
      if (
        room.type !==
        "attachedToilet"
      ) {
        return false;
      }

      const bedroom =
        rooms.find(
          candidate =>
            candidate.id ===
            room.attachedTo
        );

      return (
        !bedroom ||
        !roomsTouch(
          room,
          bedroom,
          tolerance
        )
      );
    });

  if (
    attachedToiletErrors.length
  ) {
    errors.push(
      "attached-toilet-disconnected"
    );
  }


  /*
    ---------------------------------------------------------
    BALCONY / DECK EXTERIOR CONDITION
    ---------------------------------------------------------
  */

  const exteriorBalconyErrors =
    rooms.filter(room => {
      if (
        ![
          "balcony",
          "deck"
        ].includes(
          room.type
        ) ||
        !buildable
      ) {
        return false;
      }

      return !roomTouchesExterior(
        room,
        buildable,
        tolerance
      );
    });

  if (
    exteriorBalconyErrors.length
  ) {
    errors.push(
      "balcony-not-exterior"
    );
  }


  /*
    ---------------------------------------------------------
    AREA SUMMARY

    Compound-room area is calculated from the UNION of its orthogonal parts
    so overlapping parts do not double-count area.
    ---------------------------------------------------------
  */

  const reportedArea =
    Number(
      layout?.areaSummary
        ?.calculatedRoomArea
    );

  const calculatedArea =
    round(
      roomGeometries.reduce(
        (
          sum,
          geometry
        ) =>
          sum +
          geometry.area,
        0
      )
    );

  /*
    Older callers may still report rectangle width*height while V17 carries
    compound metadata. Only enforce consistency when the reported summary is
    present and based on the same geometry model.
  */
  const hasCompoundRooms =
    roomGeometries.some(
      item =>
        item.parts.length > 1
    );

  const areaConsistent =
    !Number.isFinite(
      reportedArea
    ) ||
    (
      hasCompoundRooms &&
      layout?.geometryModel
        ?.version !==
        "orthogonal-v1"
    ) ||
    Math.abs(
      reportedArea -
      calculatedArea
    ) <
      0.2;

  if (
    !areaConsistent
  ) {
    errors.push(
      "area-summary-inconsistent"
    );
  }


  return {
    valid:
      errors.length === 0,

    errors,

    geometryModel: {
      version:
        "orthogonal-v1",
      compoundRooms:
        roomGeometries
          .filter(
            item =>
              item.parts.length >
              1
          )
          .map(
            item =>
              item.room.id
          )
    },

    overlaps,

    outOfBounds:
      outOfBounds.map(
        room =>
          room.id
      ),

    disconnectedCompoundRooms:
      disconnectedCompoundRooms.map(
        room =>
          room.id
      ),

    belowMinimum:
      belowMinimum.map(
        room =>
          room.id
      ),

    awkwardAspectRatios:
      awkwardAspectRatios.map(
        room =>
          room.id
      ),

    narrowPassages:
      narrowPassages.map(
        item =>
          item.id
      ),

    exteriorOpeningErrors:
      exteriorOpeningErrors.map(
        room =>
          room.id
      ),

    attachedToiletErrors:
      attachedToiletErrors.map(
        room =>
          room.id
      ),

    exteriorBalconyErrors:
      exteriorBalconyErrors.map(
        room =>
          room.id
      ),

    calculatedRoomArea:
      calculatedArea,

    areaConsistent
  };
}


function roomParts(room) {
  const explicit =
    room?.architecturalShape
      ?.parts;

  if (
    Array.isArray(explicit) &&
    explicit.length
  ) {
    return explicit
      .map(part => ({
        x:
          Number(part.x),
        y:
          Number(part.y),
        width:
          Number(part.width),
        height:
          Number(part.height)
      }))
      .filter(part =>
        Number.isFinite(
          part.x
        ) &&
        Number.isFinite(
          part.y
        ) &&
        part.width > 0 &&
        part.height > 0
      );
  }

  return [{
    x:
      Number(
        room?.x || 0
      ),
    y:
      Number(
        room?.y || 0
      ),
    width:
      Number(
        room?.width || 0
      ),
    height:
      Number(
        room?.height || 0
      )
  }];
}


function roomBounds(room) {
  const parts =
    roomParts(room);

  if (
    !parts.length
  ) {
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    };
  }

  const left =
    Math.min(
      ...parts.map(
        part =>
          part.x
      )
    );

  const top =
    Math.min(
      ...parts.map(
        part =>
          part.y
      )
    );

  const right =
    Math.max(
      ...parts.map(
        part =>
          part.x +
          part.width
      )
    );

  const bottom =
    Math.max(
      ...parts.map(
        part =>
          part.y +
          part.height
      )
    );

  return {
    x:
      left,
    y:
      top,
    width:
      right -
      left,
    height:
      bottom -
      top
  };
}


function roomArea(room) {
  return unionRectangleArea(
    roomParts(room)
  );
}


function unionRectangleArea(rectangles) {
  if (
    !rectangles.length
  ) {
    return 0;
  }

  const xs =
    [
      ...new Set(
        rectangles.flatMap(
          rect => [
            rect.x,
            rect.x +
              rect.width
          ]
        )
      )
    ].sort(
      (
        a,
        b
      ) =>
        a - b
    );

  let area =
    0;

  for (
    let i = 0;
    i <
    xs.length - 1;
    i++
  ) {
    const x1 =
      xs[i];

    const x2 =
      xs[i + 1];

    if (
      x2 <= x1
    ) {
      continue;
    }

    const intervals =
      rectangles
        .filter(rect =>
          rect.x <
            x2 &&
          rect.x +
            rect.width >
            x1
        )
        .map(rect => [
          rect.y,
          rect.y +
            rect.height
        ])
        .sort(
          (
            a,
            b
          ) =>
            a[0] -
            b[0]
        );

    if (
      !intervals.length
    ) {
      continue;
    }

    let covered =
      0;

    let [
      start,
      end
    ] =
      intervals[0];

    for (
      const interval
      of intervals.slice(1)
    ) {
      if (
        interval[0] <=
        end
      ) {
        end =
          Math.max(
            end,
            interval[1]
          );
      } else {
        covered +=
          end -
          start;

        [
          start,
          end
        ] =
          interval;
      }
    }

    covered +=
      end -
      start;

    area +=
      (
        x2 -
        x1
      ) *
      covered;
  }

  return area;
}


function rectangleInside(
  inner,
  outer,
  tolerance
) {
  return (
    inner.x >=
      outer.x -
        tolerance &&
    inner.y >=
      outer.y -
        tolerance &&
    inner.x +
      inner.width <=
      outer.x +
        outer.width +
        tolerance &&
    inner.y +
      inner.height <=
      outer.y +
        outer.height +
        tolerance
  );
}


function rectanglesOverlap(
  first,
  second,
  tolerance
) {
  return !(
    first.x +
      first.width <=
      second.x +
        tolerance ||
    second.x +
      second.width <=
      first.x +
        tolerance ||
    first.y +
      first.height <=
      second.y +
        tolerance ||
    second.y +
      second.height <=
      first.y +
        tolerance
  );
}


function geometriesOverlap(
  firstParts,
  secondParts,
  tolerance
) {
  return firstParts.some(
    first =>
      secondParts.some(
        second =>
          rectanglesOverlap(
            first,
            second,
            tolerance
          )
      )
  );
}


function partsFormConnectedShape(
  parts,
  tolerance
) {
  if (
    parts.length <= 1
  ) {
    return true;
  }

  const visited =
    new Set([0]);

  const queue =
    [0];

  while (
    queue.length
  ) {
    const index =
      queue.shift();

    for (
      let other = 0;
      other <
      parts.length;
      other++
    ) {
      if (
        visited.has(
          other
        )
      ) {
        continue;
      }

      if (
        rectanglesTouchOrOverlap(
          parts[index],
          parts[other],
          tolerance
        )
      ) {
        visited.add(
          other
        );

        queue.push(
          other
        );
      }
    }
  }

  return (
    visited.size ===
    parts.length
  );
}


function rectanglesTouchOrOverlap(
  first,
  second,
  tolerance
) {
  if (
    rectanglesOverlap(
      first,
      second,
      -tolerance
    )
  ) {
    return true;
  }

  return rectanglesTouch(
    first,
    second,
    tolerance
  );
}


function roomsTouch(
  first,
  second,
  tolerance
) {
  return roomParts(
    first
  ).some(
    firstPart =>
      roomParts(
        second
      ).some(
        secondPart =>
          rectanglesTouch(
            firstPart,
            secondPart,
            tolerance
          )
      )
  );
}


function roomTouchesExterior(
  room,
  buildable,
  tolerance
) {
  return roomParts(
    room
  ).some(part =>
    Math.abs(
      part.x -
      buildable.x
    ) <
      tolerance ||
    Math.abs(
      part.y -
      buildable.y
    ) <
      tolerance ||
    Math.abs(
      part.x +
      part.width -
      buildable.x -
      buildable.width
    ) <
      tolerance ||
    Math.abs(
      part.y +
      part.height -
      buildable.y -
      buildable.height
    ) <
      tolerance
  );
}


function rectanglesTouch(
  first,
  second,
  tolerance
) {
  const verticalOverlap =
    Math.min(
      first.y +
        first.height,
      second.y +
        second.height
    ) -
    Math.max(
      first.y,
      second.y
    );

  const horizontalOverlap =
    Math.min(
      first.x +
        first.width,
      second.x +
        second.width
    ) -
    Math.max(
      first.x,
      second.x
    );

  return (
    (
      Math.abs(
        first.x +
        first.width -
        second.x
      ) <
        tolerance ||
      Math.abs(
        second.x +
        second.width -
        first.x
      ) <
        tolerance
    ) &&
    verticalOverlap >
      tolerance
  ) ||
  (
    (
      Math.abs(
        first.y +
        first.height -
        second.y
      ) <
        tolerance ||
      Math.abs(
        second.y +
        second.height -
        first.y
      ) <
        tolerance
    ) &&
    horizontalOverlap >
      tolerance
  );
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
