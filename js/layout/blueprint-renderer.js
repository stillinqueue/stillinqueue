import {
  buildAccessibilityReport
} from "./accessibility.js";

/*
  Still In Queue · Blueprint Renderer V4
  ---------------------------------------
  Goal:
  make the plan look much closer to a clean architectural floor-plan:
  - strong black walls
  - dark black doors
  - dark black windows
  - clean white sheet
  const unit = layout.unit || layout.plot?.unit || "ft";
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

  // Rooms · V4 supports rectangle, L-shaped and stepped orthogonal rooms.
  rooms.forEach(room => {
    drawRoomShape(svg, room, {
      fill: "#ffffff",
      stroke: "#000000",
      strokeWidth: base * 0.95,
      vectorEffect: true
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

  // Only draw doors backed by a verified shared boundary and access route.
  const accessibility = layout.accessibilityReport || buildAccessibilityReport(layout);
  accessibility.connections.forEach(connection => {
    const room = roomMap[connection.roomId] || roomMap[connection.fromId];
    if (!room) return;
    const width = isBathroom(room.type) ? 2.5 : room.type === "living" ? 3.5 : 3.0;
    const doorWidth = Math.min(width, connection.boundary.length * 0.68);
    if (doorWidth > 1.5) drawDoorGeometry(svg, connection.boundary, doorWidth, base);
  });

  rooms.forEach(room => drawExteriorWindows(svg, room, buildable, base));

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

  const unit = layout.unit || layout.plot?.unit || "ft";
  const buildable = layout.buildableArea;
  const rooms = Array.isArray(layout.rooms) ? layout.rooms : [];
  const circulation = Array.isArray(layout.circulation) ? layout.circulation : [];
  const entrances = Array.isArray(layout.entrances) ? layout.entrances : [];
  const base = Math.max(buildable.width, buildable.height) / 100;
  const margin = Math.max(buildable.width, buildable.height) * 0.055;
  const legendWidth = Math.max(buildable.width * 0.5, base * 31);
  const footerHeight = Math.max(base * 8, margin * 1.7);
  const planX = legendWidth + margin * 2;
  const planY = margin;
  const sheetWidth = planX + buildable.width + margin;
  const sheetHeight = buildable.height + footerHeight + margin * 2;

  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${sheetWidth} ${sheetHeight}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Furnished buyer presentation floor plan");

  const defs = add(svg, "defs");
  addBuyerPatterns(defs, base);

  add(svg, "rect", {
    x: 0,
    y: 0,
    width: sheetWidth,
    height: sheetHeight,
    fill: "#ffffff"
  });

  drawBuyerLegend(svg, rooms, unit, margin, planY, legendWidth, base);

  const plan = add(svg, "g", {
    transform: `translate(${planX - buildable.x} ${planY - buildable.y})`
  });

  add(plan, "rect", {
    x: buildable.x,
    y: buildable.y,
    width: buildable.width,
    height: buildable.height,
    fill: "#f7f5ef",
    stroke: "#343434",
    "stroke-width": base * 1.3,
    filter: "url(#buyerPlanShadow)"
  });

  circulation.filter(item => !item.overlay).forEach(c => {
    add(plan, "rect", {
      x: c.x,
      y: c.y,
      width: c.width,
      height: c.height,
      fill: "url(#buyerMarble)",
      stroke: "#4b4b4b",
      "stroke-width": base * 0.42
    });
  });

  const roomMap = Object.fromEntries(rooms.map(room => [room.id, room]));

  rooms.forEach(room => {
    drawRoomShape(plan, room, {
      fill: buyerFill(room.type),
      stroke: "#3c3c3c",
      strokeWidth: base * 1.05
    });

    drawFurniture(plan, room, base, true);
  });

  circulation
    .filter(c => c.overlay)
    .forEach(c => {
      add(plan, "rect", {
        x: c.x,
        y: c.y,
        width: c.width,
        height: c.height,
        fill: "url(#buyerMarble)",
        stroke: "#4b4b4b",
        "stroke-width": base * 0.42
      });
    });

  const accessibility = layout.accessibilityReport || buildAccessibilityReport(layout);
  accessibility.connections.forEach(connection => {
    const room = roomMap[connection.roomId] || roomMap[connection.fromId];
    if (!room) return;
    const width = isBathroom(room.type) ? 2.5 : room.type === "living" ? 3.5 : 3.0;
    const doorWidth = Math.min(width, connection.boundary.length * 0.68);
    if (doorWidth > 1.5) drawDoorGeometry(plan, connection.boundary, doorWidth, base);
  });

  rooms.forEach((room, index) => {
    drawExteriorWindows(plan, room, buildable, base, true);
    drawRoomNumber(plan, room, index + 1, base);
  });

  entrances.forEach(entrance => {
    drawMainEntrance(
      plan,
      entrance,
      rooms,
      base
    );
  });

  sheetText(
    svg,
    margin,
    sheetHeight - margin * 0.55,
    `UNIT PLAN - ${options?.requirements?.house?.bhk || rooms.filter(room => ["bedroom", "masterBedroom"].includes(room.type)).length} BED CONCEPT`,
    base * 2.2,
    700,
    "start"
  );
  sheetText(
    svg,
    sheetWidth - margin,
    sheetHeight - margin * 0.55,
    "FURNISHED PRESENTATION PLAN",
    base * 1.65,
    700,
    "end"
  );

  container.innerHTML = "";
  container.appendChild(svg);
  return svg;
}


function addBuyerPatterns(defs, base) {
  const shadow = add(defs, "filter", {
    id: "buyerPlanShadow",
    x: "-15%",
    y: "-15%",
    width: "130%",
    height: "130%"
  });
  add(shadow, "feDropShadow", {
    dx: base * 0.6,
    dy: base * 0.9,
    stdDeviation: base * 0.65,
    "flood-color": "#000000",
    "flood-opacity": 0.18
  });

  const wood = add(defs, "pattern", {
    id: "buyerWood",
    width: base * 3.2,
    height: base * 1.15,
    patternUnits: "userSpaceOnUse"
  });
  add(wood, "rect", { width: base * 3.2, height: base * 1.15, fill: "#eee2cb" });
  add(wood, "path", {
    d: `M 0 ${base * 1.1} H ${base * 3.2} M ${base * 1.4} 0 V ${base * 1.1}`,
    stroke: "#d6c4a5",
    "stroke-width": base * 0.08,
    fill: "none"
  });

  const marble = add(defs, "pattern", {
    id: "buyerMarble",
    width: base * 4,
    height: base * 4,
    patternUnits: "userSpaceOnUse"
  });
  add(marble, "rect", { width: base * 4, height: base * 4, fill: "#f8f8f5" });
  add(marble, "path", {
    d: `M ${-base} ${base * 3.4} Q ${base} ${base * 1.8} ${base * 4.8} ${base * 0.9}`,
    stroke: "#d8dadd",
    "stroke-width": base * 0.09,
    opacity: 0.7,
    fill: "none"
  });

  const tile = add(defs, "pattern", {
    id: "buyerTile",
    width: base * 2.2,
    height: base * 2.2,
    patternUnits: "userSpaceOnUse"
  });
  add(tile, "rect", { width: base * 2.2, height: base * 2.2, fill: "#e9e3d8" });
  add(tile, "path", {
    d: `M ${base * 2.2} 0 H 0 V ${base * 2.2}`,
    stroke: "#c7bdae",
    "stroke-width": base * 0.08,
    fill: "none"
  });
}


function drawBuyerLegend(svg, rooms, unit, x, y, width, base) {
  sheetText(svg, x, y + base * 2.1, "LEGEND", base * 1.65, 700, "start");
  add(svg, "line", {
    x1: x,
    y1: y + base * 2.9,
    x2: x + width - base * 3,
    y2: y + base * 2.9,
    stroke: "#9a9a94",
    "stroke-width": base * 0.12
  });

  const rowHeight = base * 3.05;
  rooms.forEach((room, index) => {
    const rowY = y + base * 5 + index * rowHeight;
    sheetText(svg, x, rowY, `${index + 1}.`, base * 1.28, 500, "start");
    sheetText(svg, x + base * 3.1, rowY, room.name.toUpperCase(), base * 1.28, 600, "start");
    sheetText(
      svg,
      x + width - base * 3,
      rowY,
      formatRoomDimension(room, unit),
      base * 1.18,
      400,
      "end"
    );
  });
}


function drawRoomNumber(svg, room, number, base) {
  const radius = base * 1.15;
  const cx = room.x + room.width * 0.78;
  const cy = room.y + room.height * 0.72;
  add(svg, "circle", {
    cx,
    cy,
    r: radius,
    fill: "#fffdf8",
    stroke: "#3d3b36",
    "stroke-width": base * 0.12
  });
  sheetText(svg, cx, cy + radius * 0.34, String(number), base * 1.25, 600, "middle");
}


function sheetText(parent, x, y, value, size, weight = 500, anchor = "middle") {
  const element = add(parent, "text", {
    x,
    y,
    "text-anchor": anchor,
    "font-family": "Georgia, 'Times New Roman', serif",
    "font-size": size,
    "font-weight": weight,
    fill: "#171717"
  });
  element.textContent = value;
  return element;
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
      <span style="opacity:.75;">${escapeHtml(formatRoomDimension(room, unit))}</span>
    `;
    container.appendChild(item);
  });
}


/*
  =========================================================
  V4 · ORTHOGONAL / COMPOUND ROOM DRAWING
  =========================================================

  A room may be one rectangle or multiple connected orthogonal parts.
  We deliberately draw the UNION as one SVG path so internal seams between
  the parts do not appear as fake walls.
*/

function roomParts(room) {
  const explicit = room?.architecturalShape?.parts;

  if (Array.isArray(explicit) && explicit.length > 1) {
    const parts = explicit
      .map(part => ({
        x: Number(part.x),
        y: Number(part.y),
        width: Number(part.width),
        height: Number(part.height)
      }))
      .filter(part =>
        Number.isFinite(part.x) &&
        Number.isFinite(part.y) &&
        part.width > 0 &&
        part.height > 0
      );

    if (parts.length) return parts;
  }

  return [{
    x: Number(room?.x || 0),
    y: Number(room?.y || 0),
    width: Number(room?.width || 0),
    height: Number(room?.height || 0)
  }];
}


function roomBounds(room) {
  const parts = roomParts(room);
  const left = Math.min(...parts.map(part => part.x));
  const top = Math.min(...parts.map(part => part.y));
  const right = Math.max(...parts.map(part => part.x + part.width));
  const bottom = Math.max(...parts.map(part => part.y + part.height));

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top
  };
}


function roomArea(room) {
  const parts = roomParts(room);
  const xs = [...new Set(parts.flatMap(part => [part.x, part.x + part.width]))].sort((a, b) => a - b);
  let area = 0;

  for (let i = 0; i < xs.length - 1; i++) {
    const x1 = xs[i];
    const x2 = xs[i + 1];
    const intervals = parts
      .filter(part => part.x < x2 && part.x + part.width > x1)
      .map(part => [part.y, part.y + part.height])
      .sort((a, b) => a[0] - b[0]);

    if (!intervals.length) continue;

    let [start, end] = intervals[0];
    let covered = 0;

    for (const interval of intervals.slice(1)) {
      if (interval[0] <= end) {
        end = Math.max(end, interval[1]);
      } else {
        covered += end - start;
        [start, end] = interval;
      }
    }

    covered += end - start;
    area += (x2 - x1) * covered;
  }

  return area;
}


function roomLabelAnchor(room) {
  const parts = roomParts(room);
  if (parts.length === 1) {
    return {
      x: parts[0].x + parts[0].width / 2,
      y: parts[0].y + parts[0].height / 2
    };
  }

  /*
    Put the label in the largest component rather than in the bounding-box
    center, which might lie inside an L-shaped room's missing notch.
  */
  const largest = parts
    .slice()
    .sort((a, b) => b.width * b.height - a.width * a.height)[0];

  return {
    x: largest.x + largest.width / 2,
    y: largest.y + largest.height / 2
  };
}


function formatRoomDimension(room, unit) {
  const parts = roomParts(room);

  if (parts.length <= 1) {
    const bounds = roomBounds(room);
    return `${formatDimension(bounds.width, unit)} × ${formatDimension(bounds.height, unit)}`;
  }

  const area = roomArea(room);

  if (String(unit).toLowerCase() === "m") {
    return `${area.toFixed(1)} m² · orthogonal`;
  }

  return `${area.toFixed(0)} sq ft · orthogonal`;
}


function drawRoomShape(parent, room, options = {}) {
  const parts = roomParts(room);
  const attrs = {
    fill: options.fill || "#ffffff",
    stroke: options.stroke || "#000000",
    "stroke-width": options.strokeWidth || 1,
    "stroke-linejoin": "miter",
    "fill-rule": "evenodd"
  };

  if (options.vectorEffect) {
    attrs["vector-effect"] = "non-scaling-stroke";
  }

  if (parts.length === 1) {
    return add(parent, "rect", {
      x: parts[0].x,
      y: parts[0].y,
      width: parts[0].width,
      height: parts[0].height,
      ...attrs
    });
  }

  /*
    Draw all parts as one compound path. Internal coincident edges are then
    covered by a second fill-only pass so they do not visually read as walls.
  */
  const group = add(parent, "g");

  parts.forEach(part => {
    add(group, "rect", {
      x: part.x,
      y: part.y,
      width: part.width,
      height: part.height,
      fill: attrs.fill,
      stroke: attrs.stroke,
      "stroke-width": attrs["stroke-width"],
      "stroke-linejoin": "miter",
      ...(options.vectorEffect ? { "vector-effect": "non-scaling-stroke" } : {})
    });
  });

  /*
    Hide shared internal seams by painting a very thin fill-colored line over
    each shared part boundary. Exterior perimeter remains untouched.
  */
  for (let i = 0; i < parts.length; i++) {
    for (let j = i + 1; j < parts.length; j++) {
      coverInternalSharedEdge(group, parts[i], parts[j], attrs.fill, attrs["stroke-width"]);
    }
  }

  return group;
}


function coverInternalSharedEdge(parent, first, second, fill, strokeWidth) {
  const tolerance = 0.04;
  const yStart = Math.max(first.y, second.y);
  const yEnd = Math.min(first.y + first.height, second.y + second.height);
  const xStart = Math.max(first.x, second.x);
  const xEnd = Math.min(first.x + first.width, second.x + second.width);
  const cover = Math.max(Number(strokeWidth || 1) * 1.5, 0.04);

  if (Math.abs(first.x + first.width - second.x) < tolerance && yEnd > yStart) {
    add(parent, "line", {
      x1: first.x + first.width,
      y1: yStart,
      x2: first.x + first.width,
      y2: yEnd,
      stroke: fill,
      "stroke-width": cover
    });
  }

  if (Math.abs(second.x + second.width - first.x) < tolerance && yEnd > yStart) {
    add(parent, "line", {
      x1: first.x,
      y1: yStart,
      x2: first.x,
      y2: yEnd,
      stroke: fill,
      "stroke-width": cover
    });
  }

  if (Math.abs(first.y + first.height - second.y) < tolerance && xEnd > xStart) {
    add(parent, "line", {
      x1: xStart,
      y1: first.y + first.height,
      x2: xEnd,
      y2: first.y + first.height,
      stroke: fill,
      "stroke-width": cover
    });
  }

  if (Math.abs(second.y + second.height - first.y) < tolerance && xEnd > xStart) {
    add(parent, "line", {
      x1: xStart,
      y1: first.y,
      x2: xEnd,
      y2: first.y,
      stroke: fill,
      "stroke-width": cover
    });
  }
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
  const bounds = roomBounds(room);
  const anchor = roomLabelAnchor(room);
  const shortest = Math.min(bounds.width, bounds.height);
  const nameSize = clamp(shortest * 0.10, base * 1.30, base * 2.10);
  const dimSize = Math.max(base * 1.10, nameSize * 0.68);

  text(svg, anchor.x, anchor.y - nameSize * 0.18, room.name, nameSize, 700, "#000000");
  text(
    svg,
    anchor.x,
    anchor.y + nameSize * 0.72,
    formatRoomDimension(room, unit),
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
      entrance.width || 3.5
    );

  const side =
    String(
      entrance.side || "north"
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
      Number(
        entrance.x ||
        (
          room.x +
          room.width / 2
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
  }
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


function drawExteriorWindows(svg, room, buildable, base) {
  const tolerance = 0.04;
  const preferred = room.type === "living" ? 0.42 : isBathroom(room.type) ? 0.25 : 0.32;

  const candidates = roomParts(room).flatMap(part => {
    const items = [];
    if (Math.abs(part.y - buildable.y) < tolerance) {
      items.push({ wall: "north", part, length: part.width });
    }
    if (Math.abs(part.y + part.height - (buildable.y + buildable.height)) < tolerance) {
      items.push({ wall: "south", part, length: part.width });
    }
    if (Math.abs(part.x - buildable.x) < tolerance) {
      items.push({ wall: "west", part, length: part.height });
    }
    if (Math.abs(part.x + part.width - (buildable.x + buildable.width)) < tolerance) {
      items.push({ wall: "east", part, length: part.height });
    }
    return items;
  }).sort((a, b) => b.length - a.length);

  const candidate = candidates[0];
  if (!candidate) return;

  const { wall, part } = candidate;

  if (wall === "north" || wall === "south") {
    const length = Math.min(part.width * preferred, part.width - base * 3.5);
    if (length <= base * 1.8) return;
    const cx = part.x + part.width / 2;
    const y = wall === "north" ? part.y : part.y + part.height;
    drawWindowHorizontal(svg, cx, y, length, base);
    return;
  }

  const length = Math.min(part.height * preferred, part.height - base * 3.5);
  if (length <= base * 1.8) return;
  const cy = part.y + part.height / 2;
  const x = wall === "west" ? part.x : part.x + part.width;
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

  roomParts(room).forEach(part => {
    if (Math.abs(part.y - buildable.y) < tolerance && !walls.includes("north")) walls.push("north");
    if (Math.abs(part.x - buildable.x) < tolerance && !walls.includes("west")) walls.push("west");
    if (Math.abs(part.x + part.width - (buildable.x + buildable.width)) < tolerance && !walls.includes("east")) walls.push("east");
    if (Math.abs(part.y + part.height - (buildable.y + buildable.height)) < tolerance && !walls.includes("south")) walls.push("south");
  });

  return walls;
}


function drawFurniture(svg, room, base, buyer = false) {
  if (buyer) return drawBuyerFurniture(svg, room, base);

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


function drawBuyerFurniture(svg, room, base) {
  const stroke = "#6b6860";
  const fill = "#fffdf8";
  const type = room.type;

  if (type === "masterBedroom" || type === "bedroom") {
    const width = Math.min(room.width * 0.52, room.height * 0.72);
    const height = Math.min(room.height * 0.42, room.width * 0.54);
    const x = room.x + (room.width - width) / 2;
    const y = room.y + (room.height - height) / 2;
    add(svg, "rect", { x, y, width, height, rx: base * 0.22, fill, stroke, "stroke-width": base * 0.13 });
    add(svg, "rect", { x: x + width * 0.08, y: y + height * 0.08, width: width * 0.36, height: height * 0.2, rx: base * 0.2, fill: "#f1eee7", stroke, "stroke-width": base * 0.08 });
    add(svg, "rect", { x: x + width * 0.56, y: y + height * 0.08, width: width * 0.36, height: height * 0.2, rx: base * 0.2, fill: "#f1eee7", stroke, "stroke-width": base * 0.08 });
    add(svg, "path", { d: `M ${x + width * 0.1} ${y + height * 0.36} Q ${x + width * 0.5} ${y + height * 0.48} ${x + width * 0.9} ${y + height * 0.36}`, fill: "none", stroke: "#c9c0b2", "stroke-width": base * 0.08 });
    const tableSize = Math.min(base * 2.2, width * 0.17);
    add(svg, "rect", { x: x - tableSize * 1.15, y: y + height * 0.05, width: tableSize, height: tableSize, fill: "#e4dccd", stroke, "stroke-width": base * 0.08 });
    add(svg, "rect", { x: x + width + tableSize * 0.15, y: y + height * 0.05, width: tableSize, height: tableSize, fill: "#e4dccd", stroke, "stroke-width": base * 0.08 });
    return;
  }

  if (type === "living" || type === "familyLounge") {
    const rugW = room.width * 0.48;
    const rugH = room.height * 0.42;
    const rugX = room.x + (room.width - rugW) / 2;
    const rugY = room.y + (room.height - rugH) / 2;
    add(svg, "rect", { x: rugX, y: rugY, width: rugW, height: rugH, rx: base * 0.5, fill: "#e8dfcf", stroke: "#d3c5b0", "stroke-width": base * 0.08 });
    const sofaW = Math.min(room.width * 0.48, base * 17);
    const sofaH = Math.min(room.height * 0.17, base * 4.2);
    const sofaX = room.x + (room.width - sofaW) / 2;
    const sofaY = room.y + room.height * 0.12;
    add(svg, "rect", { x: sofaX, y: sofaY, width: sofaW, height: sofaH, rx: base * 0.45, fill, stroke, "stroke-width": base * 0.12 });
    for (let index = 1; index < 3; index++) {
      add(svg, "line", { x1: sofaX + sofaW * index / 3, y1: sofaY, x2: sofaX + sofaW * index / 3, y2: sofaY + sofaH, stroke: "#c9c5bd", "stroke-width": base * 0.07 });
    }
    add(svg, "rect", { x: rugX + rugW * 0.32, y: rugY + rugH * 0.36, width: rugW * 0.36, height: rugH * 0.3, rx: base * 0.25, fill: "#f7f4ed", stroke, "stroke-width": base * 0.1 });
    drawBuyerPlant(svg, room.x + room.width * 0.1, room.y + room.height * 0.18, base);
    return;
  }

  if (type === "dining") {
    const width = room.width * 0.4;
    const height = room.height * 0.42;
    const x = room.x + (room.width - width) / 2;
    const y = room.y + (room.height - height) / 2;
    add(svg, "rect", { x, y, width, height, rx: base * 0.18, fill: "#eee6d8", stroke, "stroke-width": base * 0.12 });
    const chairR = Math.min(base * 1.1, height * 0.15);
    [0.2, 0.5, 0.8].forEach(position => {
      add(svg, "circle", { cx: x + width * position, cy: y - chairR * 1.35, r: chairR, fill, stroke, "stroke-width": base * 0.09 });
      add(svg, "circle", { cx: x + width * position, cy: y + height + chairR * 1.35, r: chairR, fill, stroke, "stroke-width": base * 0.09 });
    });
    return;
  }

  if (type === "kitchen") {
    const depth = Math.min(base * 2.5, room.width * 0.12, room.height * 0.18);
    add(svg, "rect", { x: room.x + base * 0.55, y: room.y + base * 0.55, width: room.width - base * 1.1, height: depth, fill: "#e5e0d7", stroke, "stroke-width": base * 0.1 });
    add(svg, "rect", { x: room.x + base * 0.55, y: room.y + base * 0.55, width: depth, height: room.height * 0.56, fill: "#e5e0d7", stroke, "stroke-width": base * 0.1 });
    add(svg, "rect", { x: room.x + room.width * 0.5, y: room.y + base * 0.8, width: room.width * 0.2, height: depth * 0.5, fill: "#fafafa", stroke, "stroke-width": base * 0.08 });
    return;
  }

  if (type === "balcony" || type === "deck") {
    const inset = base * 0.7;
    add(svg, "rect", {
      x: room.x + inset,
      y: room.y + inset,
      width: Math.max(base, room.width - inset * 2),
      height: Math.max(base, room.height - inset * 2),
      fill: "none",
      stroke: "#8b8b82",
      "stroke-width": base * 0.1,
      "stroke-dasharray": `${base * 0.5} ${base * 0.35}`
    });
    drawBuyerPlant(svg, room.x + room.width / 2, room.y + room.height * 0.25, base);
    return;
  }

  if (isBathroom(type)) return drawBathroomFixtures(svg, room, base, stroke, fill);
  if (type === "utility") return drawUtility(svg, room, base, stroke, fill);
}


function drawBuyerPlant(svg, cx, cy, base) {
  add(svg, "circle", { cx, cy, r: base * 0.85, fill: "#b9c69d", stroke: "#71805f", "stroke-width": base * 0.08 });
  add(svg, "circle", { cx: cx - base * 0.55, cy: cy - base * 0.2, r: base * 0.48, fill: "#8eaa75" });
  add(svg, "circle", { cx: cx + base * 0.5, cy: cy - base * 0.35, r: base * 0.45, fill: "#789763" });
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
    living: "url(#buyerMarble)",
    familyLounge: "url(#buyerWood)",
    dining: "url(#buyerMarble)",
    kitchen: "url(#buyerMarble)",
    bedroom: "url(#buyerWood)",
    masterBedroom: "url(#buyerWood)",
    attachedToilet: "url(#buyerTile)",
    commonToilet: "url(#buyerTile)",
    utility: "url(#buyerTile)",
    puja: "url(#buyerWood)",
    store: "url(#buyerTile)",
    balcony: "url(#buyerWood)",
    deck: "url(#buyerWood)"
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
