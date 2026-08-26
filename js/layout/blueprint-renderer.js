/*
  Still In Queue · Blueprint Renderer V3
  ---------------------------------------
  Goal:
  make the plan look much closer to a clean architectural floor-plan:
  - strong black walls
  - dark black doors
  - dark black windows
  - clean white sheet
  - minimal light grid
  - clearer labels and dimensions
*/

export function renderBlueprintLayout(layout, container, options = {}) {
  if (!container) throw new Error("Blueprint container was not found.");
  if (!layout?.success) throw new Error("A successful layout is required.");

  const unit = layout.unit || layout.plot?.unit || "ft";
  const plot = layout.plot;
  const buildable = layout.buildableArea;
  const rooms = Array.isArray(layout.rooms) ? layout.rooms : [];
  const circulation = Array.isArray(layout.circulation) ? layout.circulation : [];
  const entrances = Array.isArray(layout.entrances) ? layout.entrances : [];
  const interiorDoors = Array.isArray(layout.interiorDoors) ? layout.interiorDoors : [];

  const plotW = Number(plot.width);
  const plotH = Number(plot.height);
  const base = Math.max(plotW, plotH) / 100;
  const pad = Math.max(plotW, plotH) * 0.12;

  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `${-pad} ${-pad} ${plotW + pad * 2} ${plotH + pad * 2}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Architectural floor plan");
  svg.style.background = "#ffffff";

  const defs = add(svg, "defs");
  addPattern(defs, base);

  add(svg, "rect", {
    x: -pad,
    y: -pad,
    width: plotW + pad * 2,
    height: plotH + pad * 2,
    fill: "#ffffff"
  });

  add(svg, "rect", {
    x: 0,
    y: 0,
    width: plotW,
    height: plotH,
    fill: "#ffffff"
  });

  // Plot boundary
  add(svg, "rect", {
    x: 0,
    y: 0,
    width: plotW,
    height: plotH,
    fill: "#ffffff",
    stroke: "#111111",
    "stroke-width": base * 0.55,
    "vector-effect": "non-scaling-stroke"
  });

  // Buildable area
  add(svg, "rect", {
    x: buildable.x,
    y: buildable.y,
    width: buildable.width,
    height: buildable.height,
    fill: "none",
    stroke: "#bdbdbd",
    "stroke-width": base * 0.12,
    "stroke-dasharray": `${base * 0.7} ${base * 0.5}`,
    "vector-effect": "non-scaling-stroke"
  });

  drawRoad(svg, layout.roadSide || plot.roadSide || "north", plotW, plotH, pad, base);
  drawNorthArrow(svg, plotW, pad, base);

  // Passage/corridor background
  circulation
    .filter(c => !c.overlay)
    .forEach(c => {
    add(svg, "rect", {
      x: c.x,
      y: c.y,
      width: c.width,
      height: c.height,
      fill: "#ffffff",
      stroke: "#000000",
      "stroke-width": base * 0.30
    });

    const cx = c.x + c.width / 2;
    const cy = c.y + c.height / 2;
    const circulationName =
      c.type === "foyer"
        ? "ENTRY"
        : c.name === "Landing"
          ? "HALL"
          : "PASSAGE";

    const label =
      text(
        svg,
        cx,
        cy,
        circulationName,
        base * 1.45,
        700,
        "#000000"
      );

    if (
      c.type !== "foyer" &&
      c.height > c.width * 2.1
    ) {
      label.setAttribute(
        "transform",
        `rotate(-90 ${cx} ${cy})`
      );
    }
  });

  const roomMap = Object.fromEntries(rooms.map(room => [room.id, room]));

  // Rooms
  rooms.forEach(room => {
    add(svg, "rect", {
      x: room.x,
      y: room.y,
      width: room.width,
      height: room.height,
      fill: "#ffffff",
      stroke: "#000000",
      "stroke-width": base * 0.95,
      "stroke-linejoin": "miter",
      "vector-effect": "non-scaling-stroke"
    });
  });

  /*
    Overlay passages cut visibly into the bedroom zone.
    These are drawn after room rectangles so the extension is
    actually visible, not hidden behind bedroom fills.
  */
  circulation
    .filter(c => c.overlay)
    .forEach(c => {
      add(svg, "rect", {
        x: c.x,
        y: c.y,
        width: c.width,
        height: c.height,
        fill: "#ffffff",
        stroke: "#000000",
        "stroke-width": base * 0.30
      });

      const cx =
        c.x +
        c.width / 2;

      const cy =
        c.y +
        c.height / 2;

      const label =
        text(
          svg,
          cx,
          cy,
          "HALL",
          base * 1.15,
          700,
          "#000000"
        );

      if (
        c.height >
        c.width * 1.7
      ) {
        label.setAttribute(
          "transform",
          `rotate(-90 ${cx} ${cy})`
        );
      }
    });

  // Furniture first
  rooms.forEach(room => drawFurniture(svg, room, base));

  // Doors and windows
  rooms.forEach(room => {
    drawRoomDoor(svg, room, roomMap, circulation, base);
    drawExteriorWindows(svg, room, buildable, base);
  });

  // Explicit prompt-driven internal bedroom doors
  interiorDoors.forEach(door => {
    drawExplicitInteriorDoor(
      svg,
      door,
      rooms,
      base
    );
  });

  // Main exterior entrance
  entrances.forEach(entrance => {
    drawMainEntrance(
      svg,
      entrance,
      rooms,
      base
    );
  });

  // Labels last
  rooms.forEach(room => {
    drawRoomLabel(svg, room, unit, base);
  });

  const floors = Number(options?.requirements?.house?.floors || 1);
  if (floors > 1 && circulation.length) {
    drawStairs(svg, circulation[0], base, floors);
  }

  drawOverallDimensions(svg, plotW, plotH, pad, unit, base);
  drawBuildableDimensions(svg, buildable, unit, base);

  drawTitleBlock(svg, plotW, plotH, pad, base, {
    title: options.title || `${options?.requirements?.house?.bhk || ""}BHK Concept`,
    country: layout.country || "",
    strategy: layout.placementStrategy || ""
  });

  container.innerHTML = "";
  container.appendChild(svg);
  return svg;
}


export function renderBuyerLayout(layout, container, options = {}) {
  if (!container || !layout?.success) return;

  // For now buyer plan uses the same clean dark style, slightly softer fills.
  const unit = layout.unit || layout.plot?.unit || "ft";
  const plot = layout.plot;
  const buildable = layout.buildableArea;
  const rooms = Array.isArray(layout.rooms) ? layout.rooms : [];
  const circulation = Array.isArray(layout.circulation) ? layout.circulation : [];
  const entrances = Array.isArray(layout.entrances) ? layout.entrances : [];
  const interiorDoors = Array.isArray(layout.interiorDoors) ? layout.interiorDoors : [];

  const plotW = Number(plot.width);
  const plotH = Number(plot.height);
  const base = Math.max(plotW, plotH) / 100;
  const pad = Math.max(plotW, plotH) * 0.08;

  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `${-pad} ${-pad} ${plotW + pad * 2} ${plotH + pad * 2}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  add(svg, "rect", {
    x: -pad,
    y: -pad,
    width: plotW + pad * 2,
    height: plotH + pad * 2,
    fill: "#ffffff"
  });

  add(svg, "rect", {
    x: 0,
    y: 0,
    width: plotW,
    height: plotH,
    fill: "#ffffff",
    stroke: "#111111",
    "stroke-width": base * 0.45
  });

  add(svg, "rect", {
    x: buildable.x,
    y: buildable.y,
    width: buildable.width,
    height: buildable.height,
    fill: "none",
    stroke: "#c9c9c9",
    "stroke-width": base * 0.10,
    "stroke-dasharray": `${base * 0.6} ${base * 0.45}`
  });

  circulation.forEach(c => {
    add(svg, "rect", {
      x: c.x,
      y: c.y,
      width: c.width,
      height: c.height,
      fill: "#fafafa",
      stroke: "#000000",
      "stroke-width": base * 0.10
    });
  });

  const roomMap = Object.fromEntries(rooms.map(room => [room.id, room]));

  rooms.forEach(room => {
    add(svg, "rect", {
      x: room.x,
      y: room.y,
      width: room.width,
      height: room.height,
      fill: buyerFill(room.type),
      stroke: "#000000",
      "stroke-width": base * 0.75
    });

    drawFurniture(svg, room, base, true);
  });

  circulation
    .filter(c => c.overlay)
    .forEach(c => {
      add(svg, "rect", {
        x: c.x,
        y: c.y,
        width: c.width,
        height: c.height,
        fill: "#ffffff",
        stroke: "#000000",
        "stroke-width": base * 0.24
      });
    });

  rooms.forEach(room => {
    drawRoomDoor(svg, room, roomMap, circulation, base, true);
    drawExteriorWindows(svg, room, buildable, base, true);
    drawRoomLabel(svg, room, unit, base, true);
  });

  interiorDoors.forEach(door => {
    drawExplicitInteriorDoor(
      svg,
      door,
      rooms,
      base
    );
  });

  entrances.forEach(entrance => {
    drawMainEntrance(
      svg,
      entrance,
      rooms,
      base
    );
  });

  drawRoad(svg, layout.roadSide || plot.roadSide || "north", plotW, plotH, pad, base);
  drawNorthArrow(svg, plotW, pad, base);

  text(
    svg,
    plotW / 2,
    plotH + pad * 0.72,
    "Buyer Presentation Plan · Concept only",
    base * 1.6,
    600,
    "#111111"
  );

  container.innerHTML = "";
  container.appendChild(svg);
  return svg;
}


export function renderLayoutLegend(layout, container) {
  if (!container) return;
  const unit = layout?.unit || "ft";
  const rooms = Array.isArray(layout?.rooms) ? layout.rooms : [];
  container.innerHTML = "";

  rooms.forEach(room => {
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `
      <span>${escapeHtml(room.name)}</span>
      <span style="opacity:.75;">${escapeHtml(formatDimension(room.width, unit))} × ${escapeHtml(formatDimension(room.height, unit))}</span>
    `;
    container.appendChild(item);
  });
}


function add(parent, tag, attrs = {}) {
  const ns = "http://www.w3.org/2000/svg";
  const el = document.createElementNS(ns, tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      el.setAttribute(key, String(value));
    }
  });
  parent.appendChild(el);
  return el;
}


function text(parent, x, y, value, size, weight = 600, fill = "#111111", anchor = "middle") {
  const el = add(parent, "text", {
    x,
    y,
    "text-anchor": anchor,
    "font-family": "Arial, Helvetica, sans-serif",
    "font-size": size,
    "font-weight": weight,
    "paint-order": "stroke",
    "stroke": "#ffffff",
    "stroke-width": size * 0.08,
    fill
  });
  el.textContent = value;
  return el;
}


function addPattern(defs, base) {
  const pattern = add(defs, "pattern", {
    id: "siqGrid",
    width: base * 2.2,
    height: base * 2.2,
    patternUnits: "userSpaceOnUse"
  });

  add(pattern, "path", {
    d: `M ${base * 2.2} 0 L 0 0 0 ${base * 2.2}`,
    fill: "none",
    stroke: "#f0f0f0",
    "stroke-width": base * 0.08
  });
}


function drawRoomLabel(svg, room, unit, base, buyer = false) {
  const cx = room.x + room.width / 2;
  const cy = room.y + room.height / 2;
  const shortest = Math.min(room.width, room.height);
  const nameSize = clamp(shortest * 0.10, base * 1.30, base * 2.10);
  const dimSize = Math.max(base * 1.10, nameSize * 0.68);

  text(svg, cx, cy - nameSize * 0.18, room.name, nameSize, 700, "#000000");
  text(
    svg,
    cx,
    cy + nameSize * 0.72,
    `${formatDimension(room.width, unit)} × ${formatDimension(room.height, unit)}`,
    dimSize,
    500,
    buyer ? "#111111" : "#111111"
  );
}


function drawExplicitInteriorDoor(
  svg,
  door,
  rooms,
  base
) {
  const room =
    rooms.find(
      item =>
        item.id ===
        door.roomId
    );

  if (!room) {
    return;
  }

  const width =
    Number(
      door.width || 3
    );

  const side =
    String(
      door.side || "east"
    ).toLowerCase();

  const gapStroke =
    base * 1.65;

  const lineStroke =
    base * 0.34;

  const arcStroke =
    base * 0.26;

  if (
    side === "east" ||
    side === "west"
  ) {
    const x =
      side === "east"
        ? room.x +
          room.width
        : room.x;

    const centerY =
      Number(
        door.y ||
        (
          room.y +
          room.height / 2
        )
      );

    const y1 =
      centerY -
      width / 2;

    const y2 =
      centerY +
      width / 2;

    add(svg, "line", {
      x1: x,
      y1,
      x2: x,
      y2,
      stroke: "#ffffff",
      "stroke-width": gapStroke
    });

    const inward =
      side === "east"
        ? -1
        : 1;

    const opposite =
      door.swing === "right";

    const hingeY =
      opposite
        ? y1
        : y2;

    const leafX =
      x +
      inward *
      width;

    add(svg, "line", {
      x1: x,
      y1: hingeY,
      x2: leafX,
      y2: hingeY,
      stroke: "#000000",
      "stroke-width": lineStroke
    });

    const arcEndY =
      opposite
        ? y2
        : y1;

    add(svg, "path", {
      d:
        `M ${leafX} ${hingeY} ` +
        `A ${width} ${width} 0 0 ${
          side === "east"
            ? (
                opposite
                  ? 0
                  : 1
              )
            : (
                opposite
                  ? 1
                  : 0
              )
        } ${x} ${arcEndY}`,
      fill: "none",
      stroke: "#000000",
      "stroke-width": arcStroke
    });
  }
}


function drawMainEntrance(
  svg,
  entrance,
  rooms,
  base
) {
  const room =
    rooms.find(
      item =>
        item.id ===
        entrance.roomId
    );

  if (!room) return;

  const width =
    Number(
      entrance.width ||
      3.5
    );

  const side =
    String(
      entrance.side ||
      "north"
    ).toLowerCase();

  const stroke =
    base * 0.36;

  const gapStroke =
    base * 1.85;

  if (
    side === "north" ||
    side === "south"
  ) {
    const y =
      side === "north"
        ? room.y
        : room.y +
          room.height;

    const centerX =
      Math.max(
        room.x +
          width,
        Math.min(
          room.x +
            room.width -
            width,
          Number(
            entrance.x ||
            room.x +
            room.width / 2
          )
        )
      );

    const x1 =
      centerX -
      width / 2;

    const x2 =
      centerX +
      width / 2;

    add(svg, "line", {
      x1,
      y1: y,
      x2,
      y2: y,
      stroke: "#ffffff",
      "stroke-width": gapStroke,
      "stroke-linecap": "butt"
    });

    const inward =
      side === "north"
        ? 1
        : -1;

    const leafY =
      y +
      inward *
      width;

    add(svg, "line", {
      x1,
      y1: y,
      x2: x1,
      y2: leafY,
      stroke: "#000000",
      "stroke-width": stroke
    });

    add(svg, "path", {
      d:
        `M ${x1} ${leafY} ` +
        `A ${width} ${width} 0 0 ${side === "north" ? 0 : 1} ${x2} ${y}`,
      fill: "none",
      stroke: "#000000",
      "stroke-width": base * 0.28
    });

    text(
      svg,
      centerX,
      side === "north"
        ? y +
          width +
          base * 1.1
        : y -
          width -
          base * 0.7,
      "ENTRY",
      base * 1.15,
      800,
      "#000000"
    );

    return;
  }

  const x =
    side === "east"
      ? room.x +
        room.width
      : room.x;

  const centerY =
    Math.max(
      room.y +
        width,
      Math.min(
        room.y +
          room.height -
          width,
        Number(
          entrance.y ||
          room.y +
          room.height / 2
        )
      )
    );

  const y1 =
    centerY -
    width / 2;

  const y2 =
    centerY +
    width / 2;

  add(svg, "line", {
    x1: x,
    y1,
    x2: x,
    y2,
    stroke: "#ffffff",
    "stroke-width": gapStroke,
    "stroke-linecap": "butt"
  });

  const inward =
    side === "east"
      ? -1
      : 1;

  const leafX =
    x +
    inward *
    width;

  add(svg, "line", {
    x1: x,
    y1,
    x2: leafX,
    y2: y1,
    stroke: "#000000",
    "stroke-width": stroke
  });

  add(svg, "path", {
    d:
      `M ${leafX} ${y1} ` +
      `A ${width} ${width} 0 0 ${side === "east" ? 1 : 0} ${x} ${y2}`,
    fill: "none",
    stroke: "#000000",
    "stroke-width": base * 0.28
  });

  const labelX =
    side === "east"
      ? x -
        width -
        base * 0.7
      : x +
        width +
        base * 0.7;

  const label =
    text(
      svg,
      labelX,
      centerY,
      "ENTRY",
      base * 1.15,
      800,
      "#000000"
    );

  label.setAttribute(
    "transform",
    `rotate(-90 ${labelX} ${centerY})`
  );
}


function drawRoomDoor(svg, room, roomMap, circulation, base) {
  let connection = null;

  if (room.attachedTo && roomMap[room.attachedTo]) {
    connection = sharedWall(room, roomMap[room.attachedTo]);
  }

  if (!connection) {
    for (const corridor of circulation) {
      connection = sharedWall(room, corridor);
      if (connection) break;
    }
  }

  if (!connection && circulation.length) {
    connection = nearestWallConnection(room, circulation[0]);
  }

  if (!connection) return;

  const width =
    isBathroom(room.type)
      ? 2.5
      : room.type === "living"
        ? 3.5
        : 3.0;

  const doorWidth = Math.min(width, connection.length * 0.68);
  if (!(doorWidth > 1.5)) return;

  drawDoorGeometry(svg, connection, doorWidth, base);
}


function drawDoorGeometry(svg, connection, width, base) {
  const wall = connection.wall;
  const center = connection.center;
  const wallGapStroke = base * 1.65;
  const lineStroke = base * 0.34;
  const arcStroke = base * 0.26;

  if (wall === "east" || wall === "west") {
    const x = connection.coord;
    const y1 = center - width / 2;
    const y2 = center + width / 2;

    add(svg, "line", {
      x1: x, y1,
      x2: x, y2,
      stroke: "#ffffff",
      "stroke-width": wallGapStroke,
      "stroke-linecap": "butt"
    });

    const inward = wall === "east" ? -1 : 1;
    const hingeY = y2;
    const leafX = x + inward * width;

    add(svg, "line", {
      x1: x,
      y1: hingeY,
      x2: leafX,
      y2: hingeY,
      stroke: "#000000",
      "stroke-width": lineStroke
    });

    add(svg, "path", {
      d: `M ${leafX} ${hingeY} A ${width} ${width} 0 0 ${wall === "east" ? 1 : 0} ${x} ${y1}`,
      fill: "none",
      stroke: "#000000",
      "stroke-width": arcStroke
    });

    return;
  }

  const y = connection.coord;
  const x1 = center - width / 2;
  const x2 = center + width / 2;

  add(svg, "line", {
    x1, y1: y,
    x2, y2: y,
    stroke: "#ffffff",
    "stroke-width": wallGapStroke,
    "stroke-linecap": "butt"
  });

  const inward = wall === "south" ? -1 : 1;
  const hingeX = x1;
  const leafY = y + inward * width;

  add(svg, "line", {
    x1: hingeX,
    y1: y,
    x2: hingeX,
    y2: leafY,
    stroke: "#000000",
    "stroke-width": lineStroke
  });

  add(svg, "path", {
    d: `M ${hingeX} ${leafY} A ${width} ${width} 0 0 ${wall === "south" ? 1 : 0} ${x2} ${y}`,
    fill: "none",
    stroke: "#000000",
    "stroke-width": arcStroke
  });
}


function sharedWall(a, b) {
  const tolerance = 0.04;

  const yStart = Math.max(a.y, b.y);
  const yEnd = Math.min(a.y + a.height, b.y + b.height);
  const xStart = Math.max(a.x, b.x);
  const xEnd = Math.min(a.x + a.width, b.x + b.width);

  if (Math.abs(a.x + a.width - b.x) < tolerance && yEnd > yStart) {
    return { wall: "east", coord: a.x + a.width, center: (yStart + yEnd) / 2, length: yEnd - yStart };
  }
  if (Math.abs(b.x + b.width - a.x) < tolerance && yEnd > yStart) {
    return { wall: "west", coord: a.x, center: (yStart + yEnd) / 2, length: yEnd - yStart };
  }
  if (Math.abs(a.y + a.height - b.y) < tolerance && xEnd > xStart) {
    return { wall: "south", coord: a.y + a.height, center: (xStart + xEnd) / 2, length: xEnd - xStart };
  }
  if (Math.abs(b.y + b.height - a.y) < tolerance && xEnd > xStart) {
    return { wall: "north", coord: a.y, center: (xStart + xEnd) / 2, length: xEnd - xStart };
  }

  return null;
}


function nearestWallConnection(room, target) {
  const rcx = room.x + room.width / 2;
  const rcy = room.y + room.height / 2;
  const tcx = target.x + target.width / 2;
  const tcy = target.y + target.height / 2;
  const dx = tcx - rcx;
  const dy = tcy - rcy;

  if (Math.abs(dx) >= Math.abs(dy)) {
    const wall = dx >= 0 ? "east" : "west";
    return {
      wall,
      coord: wall === "east" ? room.x + room.width : room.x,
      center: rcy,
      length: room.height
    };
  }

  const wall = dy >= 0 ? "south" : "north";
  return {
    wall,
    coord: wall === "south" ? room.y + room.height : room.y,
    center: rcx,
    length: room.width
  };
}


function drawExteriorWindows(svg, room, buildable, base) {
  const walls = exteriorWalls(room, buildable);
  if (!walls.length) return;

  const wall = walls[0];
  const preferred = room.type === "living" ? 0.42 : isBathroom(room.type) ? 0.25 : 0.32;

  if (wall === "north" || wall === "south") {
    const length = Math.min(room.width * preferred, room.width - base * 3.5);
    if (length <= base * 1.8) return;
    const cx = room.x + room.width / 2;
    const y = wall === "north" ? room.y : room.y + room.height;
    drawWindowHorizontal(svg, cx, y, length, base);
    return;
  }

  const length = Math.min(room.height * preferred, room.height - base * 3.5);
  if (length <= base * 1.8) return;
  const cy = room.y + room.height / 2;
  const x = wall === "west" ? room.x : room.x + room.width;
  drawWindowVertical(svg, x, cy, length, base);
}


function drawWindowHorizontal(svg, cx, y, width, base) {
  const gap = base * 0.18;

  add(svg, "line", {
    x1: cx - width / 2,
    y1: y,
    x2: cx + width / 2,
    y2: y,
    stroke: "#ffffff",
    "stroke-width": base * 1.65
  });

  add(svg, "line", {
    x1: cx - width / 2,
    y1: y - gap,
    x2: cx + width / 2,
    y2: y - gap,
    stroke: "#000000",
    "stroke-width": base * 0.30
  });

  add(svg, "line", {
    x1: cx - width / 2,
    y1: y + gap,
    x2: cx + width / 2,
    y2: y + gap,
    stroke: "#000000",
    "stroke-width": base * 0.30
  });
}


function drawWindowVertical(svg, x, cy, height, base) {
  const gap = base * 0.18;

  add(svg, "line", {
    x1: x,
    y1: cy - height / 2,
    x2: x,
    y2: cy + height / 2,
    stroke: "#ffffff",
    "stroke-width": base * 1.65
  });

  add(svg, "line", {
    x1: x - gap,
    y1: cy - height / 2,
    x2: x - gap,
    y2: cy + height / 2,
    stroke: "#000000",
    "stroke-width": base * 0.30
  });

  add(svg, "line", {
    x1: x + gap,
    y1: cy - height / 2,
    x2: x + gap,
    y2: cy + height / 2,
    stroke: "#000000",
    "stroke-width": base * 0.30
  });
}


function exteriorWalls(room, buildable) {
  const tolerance = 0.04;
  const walls = [];

  if (Math.abs(room.y - buildable.y) < tolerance) walls.push("north");
  if (Math.abs(room.x - buildable.x) < tolerance) walls.push("west");
  if (Math.abs(room.x + room.width - (buildable.x + buildable.width)) < tolerance) walls.push("east");
  if (Math.abs(room.y + room.height - (buildable.y + buildable.height)) < tolerance) walls.push("south");

  return walls;
}


function drawFurniture(svg, room, base, buyer = false) {
  const stroke = "#000000";
  const light = buyer ? "#ffffff" : "#ffffff";
  const type = room.type;

  if (type === "masterBedroom" || type === "bedroom") return drawBed(svg, room, base, stroke, light);
  if (type === "living" || type === "familyLounge") return drawSofa(svg, room, base, stroke, light);
  if (type === "dining") return drawDining(svg, room, base, stroke, light);
  if (type === "kitchen") return drawKitchen(svg, room, base, stroke, light);
  if (isBathroom(type)) return drawBathroomFixtures(svg, room, base, stroke, light);
  if (type === "utility") return drawUtility(svg, room, base, stroke, light);
}


function drawBed(svg, room, base, stroke, fill) {
  const w = Math.min(room.width * 0.42, room.height * 0.60);
  const h = Math.min(room.height * 0.30, room.width * 0.48);
  if (w < base * 4.5 || h < base * 3) return;

  const x = room.x + (room.width - w) / 2;
  const y = room.y + room.height * 0.12;

  add(svg, "rect", {
    x, y,
    width: w,
    height: h,
    fill,
    stroke,
    "stroke-width": base * 0.10
  });

  add(svg, "rect", {
    x: x + w * 0.08,
    y: y + h * 0.08,
    width: w * 0.34,
    height: h * 0.18,
    fill: "#ffffff",
    stroke,
    "stroke-width": base * 0.08
  });

  add(svg, "rect", {
    x: x + w * 0.58,
    y: y + h * 0.08,
    width: w * 0.34,
    height: h * 0.18,
    fill: "#ffffff",
    stroke,
    "stroke-width": base * 0.08
  });
}


function drawSofa(svg, room, base, stroke, fill) {
  const w = room.width * 0.42;
  const h = Math.min(room.height * 0.14, room.width * 0.14);
  if (w < base * 4.5 || h < base * 1.5) return;

  const x = room.x + (room.width - w) / 2;
  const y = room.y + room.height * 0.12;

  add(svg, "rect", {
    x, y,
    width: w,
    height: h,
    fill,
    stroke,
    "stroke-width": base * 0.10
  });

  add(svg, "line", {
    x1: x + w / 3, y1: y,
    x2: x + w / 3, y2: y + h,
    stroke,
    "stroke-width": base * 0.08
  });

  add(svg, "line", {
    x1: x + (2 * w) / 3, y1: y,
    x2: x + (2 * w) / 3, y2: y + h,
    stroke,
    "stroke-width": base * 0.08
  });
}


function drawDining(svg, room, base, stroke, fill) {
  const w = room.width * 0.34;
  const h = room.height * 0.18;
  if (w < base * 4 || h < base * 1.6) return;

  const cx = room.x + room.width / 2;
  const y = room.y + room.height * 0.14;

  add(svg, "rect", {
    x: cx - w / 2,
    y,
    width: w,
    height: h,
    fill,
    stroke,
    "stroke-width": base * 0.10
  });

  const chair = base * 0.78;
  [
    [cx - w * 0.28, y - chair * 0.8],
    [cx + w * 0.28, y - chair * 0.8],
    [cx - w * 0.28, y + h + chair * 0.15],
    [cx + w * 0.28, y + h + chair * 0.15]
  ].forEach(([x, yy]) => {
    add(svg, "rect", {
      x: x - chair / 2,
      y: yy,
      width: chair,
      height: chair * 0.60,
      fill,
      stroke,
      "stroke-width": base * 0.08
    });
  });
}


function drawKitchen(svg, room, base, stroke, fill) {
  const depth = Math.min(room.height * 0.12, room.width * 0.12);
  if (depth < base * 0.6) return;

  add(svg, "rect", {
    x: room.x + base * 0.55,
    y: room.y + base * 0.55,
    width: Math.max(base * 2, room.width - base * 1.1),
    height: depth,
    fill,
    stroke,
    "stroke-width": base * 0.08
  });

  const sinkW = Math.min(room.width * 0.18, base * 3.0);

  add(svg, "rect", {
    x: room.x + room.width / 2 - sinkW / 2,
    y: room.y + base * 0.68,
    width: sinkW,
    height: depth * 0.52,
    fill: "#ffffff",
    stroke,
    "stroke-width": base * 0.08
  });
}


function drawBathroomFixtures(svg, room, base, stroke, fill) {
  const min = Math.min(room.width, room.height);
  if (min < base * 4) return;

  const toiletW = Math.min(room.width * 0.18, base * 1.6);
  const toiletH = toiletW * 1.35;
  const x = room.x + base * 0.7;
  const y = room.y + base * 0.7;

  add(svg, "rect", {
    x, y,
    width: toiletW,
    height: toiletH * 0.34,
    fill,
    stroke,
    "stroke-width": base * 0.08
  });

  add(svg, "ellipse", {
    cx: x + toiletW / 2,
    cy: y + toiletH * 0.68,
    rx: toiletW * 0.40,
    ry: toiletH * 0.30,
    fill,
    stroke,
    "stroke-width": base * 0.08
  });

  const shower = Math.min(room.width, room.height) * 0.22;
  const sx = room.x + room.width - shower - base * 0.55;
  const sy = room.y + base * 0.55;

  add(svg, "rect", {
    x: sx,
    y: sy,
    width: shower,
    height: shower,
    fill: "none",
    stroke,
    "stroke-width": base * 0.08
  });

  add(svg, "line", {
    x1: sx, y1: sy,
    x2: sx + shower, y2: sy + shower,
    stroke,
    "stroke-width": base * 0.06
  });

  add(svg, "line", {
    x1: sx + shower, y1: sy,
    x2: sx, y2: sy + shower,
    stroke,
    "stroke-width": base * 0.06
  });
}


function drawUtility(svg, room, base, stroke, fill) {
  const size = Math.min(room.width, room.height) * 0.28;
  if (size < base * 1.5) return;

  const x = room.x + base * 0.6;
  const y = room.y + base * 0.6;

  add(svg, "rect", {
    x, y,
    width: size,
    height: size,
    fill,
    stroke,
    "stroke-width": base * 0.08
  });

  add(svg, "circle", {
    cx: x + size / 2,
    cy: y + size / 2,
    r: size * 0.30,
    fill: "none",
    stroke,
    "stroke-width": base * 0.08
  });
}


function drawStairs(svg, corridor, base, floors) {
  const horizontal = corridor.width > corridor.height;
  const length = horizontal ? corridor.width * 0.22 : corridor.height * 0.18;
  const breadth = horizontal
    ? Math.min(corridor.height * 0.72, base * 6)
    : Math.min(corridor.width * 0.72, base * 6);

  if (length < base * 5 || breadth < base * 2) return;

  const cx = corridor.x + corridor.width / 2;
  const cy = corridor.y + corridor.height / 2;
  const x = cx - (horizontal ? length : breadth) / 2;
  const y = cy - (horizontal ? breadth : length) / 2;
  const w = horizontal ? length : breadth;
  const h = horizontal ? breadth : length;

  add(svg, "rect", {
    x, y,
    width: w,
    height: h,
    fill: "#ffffff",
    stroke: "#000000",
    "stroke-width": base * 0.10
  });

  const steps = 7;
  for (let i = 1; i < steps; i++) {
    if (horizontal) {
      const xx = x + (w * i) / steps;
      add(svg, "line", {
        x1: xx, y1: y,
        x2: xx, y2: y + h,
        stroke: "#000000",
        "stroke-width": base * 0.07
      });
    } else {
      const yy = y + (h * i) / steps;
      add(svg, "line", {
        x1: x, y1: yy,
        x2: x + w, y2: yy,
        stroke: "#000000",
        "stroke-width": base * 0.07
      });
    }
  }

  text(svg, cx, cy, floors > 1 ? "UP" : "STAIR", base * 1.2, 700, "#000000");
}


function drawOverallDimensions(svg, plotW, plotH, pad, unit, base) {
  const y = -pad * 0.48;

  add(svg, "line", {
    x1: 0, y1: y,
    x2: plotW, y2: y,
    stroke: "#000000",
    "stroke-width": base * 0.10
  });

  add(svg, "line", {
    x1: 0, y1: y - base * 0.5,
    x2: 0, y2: y + base * 0.5,
    stroke: "#000000",
    "stroke-width": base * 0.10
  });

  add(svg, "line", {
    x1: plotW, y1: y - base * 0.5,
    x2: plotW, y2: y + base * 0.5,
    stroke: "#000000",
    "stroke-width": base * 0.10
  });

  text(svg, plotW / 2, y - base * 0.55, formatDimension(plotW, unit), base * 1.45, 600, "#000000");

  const x = -pad * 0.48;

  add(svg, "line", {
    x1: x, y1: 0,
    x2: x, y2: plotH,
    stroke: "#000000",
    "stroke-width": base * 0.10
  });

  add(svg, "line", {
    x1: x - base * 0.5, y1: 0,
    x2: x + base * 0.5, y2: 0,
    stroke: "#000000",
    "stroke-width": base * 0.10
  });

  add(svg, "line", {
    x1: x - base * 0.5, y1: plotH,
    x2: x + base * 0.5, y2: plotH,
    stroke: "#000000",
    "stroke-width": base * 0.10
  });

  const label = text(svg, x - base * 0.8, plotH / 2, formatDimension(plotH, unit), base * 1.45, 600, "#000000");
  label.setAttribute("transform", `rotate(-90 ${x - base * 0.8} ${plotH / 2})`);
}


function drawBuildableDimensions(svg, buildable, unit, base) {
  text(
    svg,
    buildable.x + buildable.width / 2,
    buildable.y - base * 0.70,
    `BUILDABLE ${formatDimension(buildable.width, unit)}`,
    base * 0.95,
    500,
    "#666666"
  );
}


function drawRoad(svg, roadSide, plotW, plotH, pad, base) {
  const side = String(roadSide || "north").toLowerCase();

  let x;
  let y;
  let rotation = null;

  if (side === "south") {
    x = plotW / 2;
    y = plotH + pad * 0.30;
  } else if (side === "east") {
    x = plotW + pad * 0.30;
    y = plotH / 2;
    rotation = 90;
  } else if (side === "west") {
    x = -pad * 0.30;
    y = plotH / 2;
    rotation = -90;
  } else {
    x = plotW / 2;
    y = -pad * 0.30;
  }

  const label = text(svg, x, y, `ROAD · ${side.toUpperCase()}`, base * 1.35, 600, "#000000");
  if (rotation !== null) {
    label.setAttribute("transform", `rotate(${rotation} ${x} ${y})`);
  }
}


function drawNorthArrow(svg, plotW, pad, base) {
  const x = plotW - pad * 0.45;
  const y = pad * 0.28;

  const g = add(svg, "g", {
    transform: `translate(${x} ${y})`
  });

  add(g, "line", {
    x1: 0, y1: base * 1.6,
    x2: 0, y2: -base * 1.2,
    stroke: "#000000",
    "stroke-width": base * 0.14
  });

  add(g, "path", {
    d: `M 0 ${-base * 1.8} L ${-base * 0.5} ${-base * 0.7} L ${base * 0.5} ${-base * 0.7} Z`,
    fill: "#000000"
  });

  text(g, 0, -base * 2.25, "N", base * 1.25, 700, "#000000");
}


function drawTitleBlock(svg, plotW, plotH, pad, base, info) {
  const y = plotH + pad * 0.60;

  text(svg, plotW / 2, y, info.title || "Concept Plan", base * 1.25, 700, "#000000");

  const details = [
    info.country ? `Profile: ${capitalize(info.country)}` : null,
    info.strategy ? `Layout: ${info.strategy}` : null,
    "Concept plan"
  ].filter(Boolean).join(" · ");

  text(svg, plotW / 2, y + base * 1.65, details, base * 0.95, 400, "#444444");
}


function buyerFill(type) {
  const fills = {
    living: "#fbfbfb",
    familyLounge: "#fbfbfb",
    dining: "#fbfbfb",
    kitchen: "#fbfbfb",
    bedroom: "#fdfdfd",
    masterBedroom: "#fdfdfd",
    attachedToilet: "#fcfcfc",
    commonToilet: "#fcfcfc",
    utility: "#fcfcfc",
    puja: "#fcfcfc",
    store: "#fcfcfc"
  };
  return fills[type] || "#ffffff";
}


function isBathroom(type) {
  return type === "attachedToilet" || type === "commonToilet" || type === "bath";
}


function formatDimension(value, unit) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";

  if (String(unit).toLowerCase() === "m") {
    return `${n.toFixed(2)} m`;
  }

  const totalInches = Math.round(n * 12);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'-${inches}"`;
}


function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}


function capitalize(value) {
  const s = String(value || "");
  return s.charAt(0).toUpperCase() + s.slice(1);
}


function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
