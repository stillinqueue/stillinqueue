/*
  Still In Queue · Blueprint Renderer V2
  ---------------------------------------
  Input: layout from generateLayout(requirements)

  Output:
  - Engineer-style black/white SVG
  - doors + swing arcs
  - exterior windows
  - furniture / fixture cues
  - room names + dimensions
  - circulation passage
  - plot/buildable dimensions
  - road side + north arrow

  Concept planning only. Not a permit or construction drawing.
*/

export function renderBlueprintLayout(layout, container, options = {}) {
  if (!container) throw new Error("Blueprint container was not found.");
  if (!layout?.success) throw new Error("A successful layout is required.");

  const unit = layout.unit || layout.plot?.unit || "ft";
  const plot = layout.plot;
  const buildable = layout.buildableArea;
  const rooms = Array.isArray(layout.rooms) ? layout.rooms : [];
  const circulation = Array.isArray(layout.circulation) ? layout.circulation : [];

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
  svg.setAttribute("data-blueprint-v2", "true");
  svg.style.background = "#ffffff";

  const defs = add(svg, "defs");
  addPattern(defs, base);

  add(svg, "rect", {
    x: -pad, y: -pad,
    width: plotW + pad * 2,
    height: plotH + pad * 2,
    fill: "#ffffff"
  });

  add(svg, "rect", {
    x: 0, y: 0,
    width: plotW,
    height: plotH,
    fill: "url(#siqGrid)"
  });

  drawRoad(svg, layout.roadSide || plot.roadSide || "north", plotW, plotH, pad, base);
  drawNorthArrow(svg, plotW, pad, base);

  add(svg, "rect", {
    x: 0, y: 0,
    width: plotW,
    height: plotH,
    fill: "none",
    stroke: "#111111",
    "stroke-width": base * 0.48,
    "vector-effect": "non-scaling-stroke"
  });

  add(svg, "rect", {
    x: buildable.x,
    y: buildable.y,
    width: buildable.width,
    height: buildable.height,
    fill: "none",
    stroke: "#9ca3af",
    "stroke-width": base * 0.22,
    "stroke-dasharray": `${base * 1.1} ${base * 0.8}`,
    "vector-effect": "non-scaling-stroke"
  });

  circulation.forEach(c => {
    add(svg, "rect", {
      x: c.x, y: c.y,
      width: c.width,
      height: c.height,
      fill: "#fafafa",
      stroke: "#d1d5db",
      "stroke-width": base * 0.22
    });

    const cx = c.x + c.width / 2;
    const cy = c.y + c.height / 2;
    const label = text(svg, cx, cy, "PASSAGE", base * 2.0, 700, "#374151");

    if (c.height > c.width * 2.2) {
      label.setAttribute("transform", `rotate(-90 ${cx} ${cy})`);
    }
  });

  const roomMap = Object.fromEntries(rooms.map(room => [room.id, room]));

  rooms.forEach(room => {
    add(svg, "rect", {
      x: room.x,
      y: room.y,
      width: room.width,
      height: room.height,
      fill: "#ffffff",
      stroke: "#0b0b0b",
      "stroke-width": base * 0.72,
      "stroke-linejoin": "miter",
      "vector-effect": "non-scaling-stroke"
    });
  });

  rooms.forEach(room => drawFurniture(svg, room, base, false));

  rooms.forEach(room => {
    drawRoomDoor(svg, room, roomMap, circulation, base);
    drawExteriorWindows(svg, room, buildable, base);
  });

  rooms.forEach(room => drawRoomLabel(svg, room, unit, base, false));

  const floors = Number(options?.requirements?.house?.floors || 1);
  if (floors > 1 && circulation.length) {
    drawStairs(svg, circulation[0], base, floors);
  }

  drawOverallDimensions(svg, plotW, plotH, pad, unit, base);
  drawBuildableDimensions(svg, buildable, unit, base);

  drawTitleBlock(svg, plotW, plotH, pad, base, {
    title: options.title || `${options?.requirements?.house?.bhk || ""}BHK Concept Plan`,
    country: layout.country || "",
    strategy: layout.placementStrategy || "",
    adaptations: layout.adaptations || []
  });

  container.innerHTML = "";
  container.appendChild(svg);

  return svg;
}


export function renderBuyerLayout(layout, container, options = {}) {
  if (!container || !layout?.success) return;

  const unit = layout.unit || layout.plot?.unit || "ft";
  const plot = layout.plot;
  const buildable = layout.buildableArea;
  const rooms = Array.isArray(layout.rooms) ? layout.rooms : [];
  const circulation = Array.isArray(layout.circulation) ? layout.circulation : [];

  const plotW = Number(plot.width);
  const plotH = Number(plot.height);
  const base = Math.max(plotW, plotH) / 100;
  const pad = Math.max(plotW, plotH) * 0.08;

  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `${-pad} ${-pad} ${plotW + pad * 2} ${plotH + pad * 2}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Buyer presentation floor plan");

  add(svg, "rect", {
    x: -pad, y: -pad,
    width: plotW + pad * 2,
    height: plotH + pad * 2,
    fill: "#f8fafc"
  });

  add(svg, "rect", {
    x: 0, y: 0,
    width: plotW,
    height: plotH,
    fill: "#f3f7f2",
    stroke: "#64748b",
    "stroke-width": base * 0.26
  });

  add(svg, "rect", {
    x: buildable.x,
    y: buildable.y,
    width: buildable.width,
    height: buildable.height,
    fill: "#ffffff",
    stroke: "#cbd5e1",
    "stroke-width": base * 0.18,
    "stroke-dasharray": `${base * 0.8} ${base * 0.5}`
  });

  circulation.forEach(c => {
    add(svg, "rect", {
      x: c.x, y: c.y,
      width: c.width,
      height: c.height,
      fill: "#f1f5f9",
      stroke: "#cbd5e1",
      "stroke-width": base * 0.18
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
      stroke: "#334155",
      "stroke-width": base * 0.44
    });

    drawFurniture(svg, room, base, true);
  });

  rooms.forEach(room => {
    drawRoomDoor(svg, room, roomMap, circulation, base);
    drawExteriorWindows(svg, room, buildable, base);
    drawRoomLabel(svg, room, unit, base, true);
  });

  drawRoad(svg, layout.roadSide || plot.roadSide || "north", plotW, plotH, pad, base);

  text(
    svg,
    plotW / 2,
    plotH + pad * 0.72,
    "Buyer Presentation Plan · Concept only · verify dimensions before construction",
    base * 1.9,
    600,
    "#475569"
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

    const dims =
      `${formatDimension(room.width, unit)} × ${formatDimension(room.height, unit)}`;

    item.innerHTML = `
      <span>${escapeHtml(room.name)}</span>
      <span style="opacity:.65;">${escapeHtml(dims)}</span>
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
    x, y,
    "text-anchor": anchor,
    "font-family": "Inter, Arial, sans-serif",
    "font-size": size,
    "font-weight": weight,
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
    stroke: "#f3f4f6",
    "stroke-width": base * 0.10
  });
}


function drawRoomLabel(svg, room, unit, base, buyer = false) {
  const cx = room.x + room.width / 2;
  const cy = room.y + room.height / 2;

  const shortest = Math.min(room.width, room.height);
  const nameSize = clamp(shortest * 0.11, base * 1.45, base * 2.45);
  const dimensionSize = Math.max(base * 1.25, nameSize * 0.72);

  text(
    svg,
    cx,
    cy - nameSize * 0.18,
    room.name,
    nameSize,
    buyer ? 750 : 650,
    "#111827"
  );

  text(
    svg,
    cx,
    cy + nameSize * 0.72,
    `${formatDimension(room.width, unit)} × ${formatDimension(room.height, unit)}`,
    dimensionSize,
    550,
    buyer ? "#475569" : "#374151"
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

  const rawWidth =
    isBathroom(room.type)
      ? 2.5
      : room.type === "living"
        ? 3.5
        : 3.0;

  const doorWidth = Math.min(
    rawWidth,
    connection.length * 0.68
  );

  if (!(doorWidth > 1.6)) return;

  drawDoorGeometry(svg, connection, doorWidth, base);
}


function drawDoorGeometry(svg, connection, width, base) {
  const wall = connection.wall;
  const center = connection.center;
  const gapStroke = base * 1.35;
  const lineStroke = base * 0.27;

  if (wall === "east" || wall === "west") {
    const x = connection.coord;
    const y1 = center - width / 2;
    const y2 = center + width / 2;

    add(svg, "line", {
      x1: x, y1,
      x2: x, y2,
      stroke: "#ffffff",
      "stroke-width": gapStroke,
      "stroke-linecap": "butt"
    });

    const inward = wall === "east" ? -1 : 1;
    const hingeY = y2;
    const leafX = x + inward * width;

    add(svg, "line", {
      x1: x, y1: hingeY,
      x2: leafX, y2: hingeY,
      stroke: "#111827",
      "stroke-width": lineStroke
    });

    add(svg, "path", {
      d:
        `M ${leafX} ${hingeY} ` +
        `A ${width} ${width} 0 0 ${wall === "east" ? 1 : 0} ${x} ${y1}`,
      fill: "none",
      stroke: "#6b7280",
      "stroke-width": base * 0.18
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
    "stroke-width": gapStroke,
    "stroke-linecap": "butt"
  });

  const inward = wall === "south" ? -1 : 1;
  const hingeX = x1;
  const leafY = y + inward * width;

  add(svg, "line", {
    x1: hingeX, y1: y,
    x2: hingeX, y2: leafY,
    stroke: "#111827",
    "stroke-width": lineStroke
  });

  add(svg, "path", {
    d:
      `M ${hingeX} ${leafY} ` +
      `A ${width} ${width} 0 0 ${wall === "south" ? 1 : 0} ${x2} ${y}`,
    fill: "none",
    stroke: "#6b7280",
    "stroke-width": base * 0.18
  });
}


function sharedWall(a, b) {
  const tolerance = 0.04;

  const yStart = Math.max(a.y, b.y);
  const yEnd = Math.min(a.y + a.height, b.y + b.height);
  const xStart = Math.max(a.x, b.x);
  const xEnd = Math.min(a.x + a.width, b.x + b.width);

  if (Math.abs(a.x + a.width - b.x) < tolerance && yEnd > yStart) {
    return {
      wall: "east",
      coord: a.x + a.width,
      center: (yStart + yEnd) / 2,
      length: yEnd - yStart
    };
  }

  if (Math.abs(b.x + b.width - a.x) < tolerance && yEnd > yStart) {
    return {
      wall: "west",
      coord: a.x,
      center: (yStart + yEnd) / 2,
      length: yEnd - yStart
    };
  }

  if (Math.abs(a.y + a.height - b.y) < tolerance && xEnd > xStart) {
    return {
      wall: "south",
      coord: a.y + a.height,
      center: (xStart + xEnd) / 2,
      length: xEnd - xStart
    };
  }

  if (Math.abs(b.y + b.height - a.y) < tolerance && xEnd > xStart) {
    return {
      wall: "north",
      coord: a.y,
      center: (xStart + xEnd) / 2,
      length: xEnd - xStart
    };
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
  const exterior = exteriorWalls(room, buildable);
  if (!exterior.length) return;

  const preferred =
    room.type === "living"
      ? 0.42
      : isBathroom(room.type)
        ? 0.28
        : 0.34;

  const wall = exterior[0];

  if (wall === "north" || wall === "south") {
    const length = Math.min(
      room.width * preferred,
      room.width - base * 4
    );

    if (length <= base * 2) return;

    const cx = room.x + room.width / 2;
    const y = wall === "north" ? room.y : room.y + room.height;

    drawWindowHorizontal(svg, cx, y, length, base);
    return;
  }

  const length = Math.min(
    room.height * preferred,
    room.height - base * 4
  );

  if (length <= base * 2) return;

  const cy = room.y + room.height / 2;
  const x = wall === "west" ? room.x : room.x + room.width;

  drawWindowVertical(svg, x, cy, length, base);
}


function drawWindowHorizontal(svg, cx, y, width, base) {
  const gap = base * 0.32;

  add(svg, "line", {
    x1: cx - width / 2, y1: y,
    x2: cx + width / 2, y2: y,
    stroke: "#ffffff",
    "stroke-width": base * 1.2
  });

  add(svg, "line", {
    x1: cx - width / 2, y1: y - gap,
    x2: cx + width / 2, y2: y - gap,
    stroke: "#64748b",
    "stroke-width": base * 0.20
  });

  add(svg, "line", {
    x1: cx - width / 2, y1: y + gap,
    x2: cx + width / 2, y2: y + gap,
    stroke: "#64748b",
    "stroke-width": base * 0.20
  });
}


function drawWindowVertical(svg, x, cy, height, base) {
  const gap = base * 0.32;

  add(svg, "line", {
    x1: x, y1: cy - height / 2,
    x2: x, y2: cy + height / 2,
    stroke: "#ffffff",
    "stroke-width": base * 1.2
  });

  add(svg, "line", {
    x1: x - gap, y1: cy - height / 2,
    x2: x - gap, y2: cy + height / 2,
    stroke: "#64748b",
    "stroke-width": base * 0.20
  });

  add(svg, "line", {
    x1: x + gap, y1: cy - height / 2,
    x2: x + gap, y2: cy + height / 2,
    stroke: "#64748b",
    "stroke-width": base * 0.20
  });
}


function exteriorWalls(room, buildable) {
  const tolerance = 0.04;
  const walls = [];

  if (Math.abs(room.y - buildable.y) < tolerance) walls.push("north");
  if (Math.abs(room.x - buildable.x) < tolerance) walls.push("west");

  if (
    Math.abs(
      room.x + room.width -
      (buildable.x + buildable.width)
    ) < tolerance
  ) {
    walls.push("east");
  }

  if (
    Math.abs(
      room.y + room.height -
      (buildable.y + buildable.height)
    ) < tolerance
  ) {
    walls.push("south");
  }

  return walls;
}


function drawFurniture(svg, room, base, buyer = false) {
  const stroke = buyer ? "#94a3b8" : "#9ca3af";
  const fill = buyer ? "#ffffffcc" : "#ffffff";
  const type = room.type;

  if (type === "masterBedroom" || type === "bedroom") {
    drawBed(svg, room, base, stroke, fill);
    return;
  }

  if (type === "living" || type === "familyLounge") {
    drawSofa(svg, room, base, stroke, fill);
    return;
  }

  if (type === "dining") {
    drawDining(svg, room, base, stroke, fill);
    return;
  }

  if (type === "kitchen") {
    drawKitchen(svg, room, base, stroke, fill);
    return;
  }

  if (isBathroom(type)) {
    drawBathroomFixtures(svg, room, base, stroke, fill);
    return;
  }

  if (type === "utility") {
    drawUtility(svg, room, base, stroke, fill);
  }
}


function drawBed(svg, room, base, stroke, fill) {
  const w = Math.min(room.width * 0.46, room.height * 0.65);
  const h = Math.min(room.height * 0.32, room.width * 0.52);

  if (w < base * 5 || h < base * 3) return;

  const x = room.x + (room.width - w) / 2;
  const y = room.y + room.height * 0.10;

  add(svg, "rect", {
    x, y,
    width: w,
    height: h,
    rx: base * 0.35,
    fill,
    stroke,
    "stroke-width": base * 0.16
  });

  add(svg, "rect", {
    x: x + w * 0.08,
    y: y + h * 0.07,
    width: w * 0.36,
    height: h * 0.18,
    rx: base * 0.20,
    fill: "#f8fafc",
    stroke,
    "stroke-width": base * 0.10
  });

  add(svg, "rect", {
    x: x + w * 0.56,
    y: y + h * 0.07,
    width: w * 0.36,
    height: h * 0.18,
    rx: base * 0.20,
    fill: "#f8fafc",
    stroke,
    "stroke-width": base * 0.10
  });
}


function drawSofa(svg, room, base, stroke, fill) {
  const w = room.width * 0.48;
  const h = Math.min(room.height * 0.16, room.width * 0.16);

  if (w < base * 5 || h < base * 1.5) return;

  const x = room.x + (room.width - w) / 2;
  const y = room.y + room.height * 0.12;

  add(svg, "rect", {
    x, y,
    width: w,
    height: h,
    rx: base * 0.45,
    fill,
    stroke,
    "stroke-width": base * 0.16
  });

  add(svg, "line", {
    x1: x + w / 3, y1: y,
    x2: x + w / 3, y2: y + h,
    stroke,
    "stroke-width": base * 0.10
  });

  add(svg, "line", {
    x1: x + (w * 2) / 3, y1: y,
    x2: x + (w * 2) / 3, y2: y + h,
    stroke,
    "stroke-width": base * 0.10
  });
}


function drawDining(svg, room, base, stroke, fill) {
  const w = room.width * 0.38;
  const h = room.height * 0.20;

  if (w < base * 4 || h < base * 1.8) return;

  const cx = room.x + room.width / 2;
  const y = room.y + room.height * 0.12;

  add(svg, "rect", {
    x: cx - w / 2,
    y,
    width: w,
    height: h,
    rx: base * 0.22,
    fill,
    stroke,
    "stroke-width": base * 0.14
  });

  const chair = base * 0.85;

  [
    [cx - w * 0.28, y - chair * 0.85],
    [cx + w * 0.28, y - chair * 0.85],
    [cx - w * 0.28, y + h + chair * 0.15],
    [cx + w * 0.28, y + h + chair * 0.15]
  ].forEach(([x, yy]) => {
    add(svg, "rect", {
      x: x - chair / 2,
      y: yy,
      width: chair,
      height: chair * 0.65,
      rx: base * 0.10,
      fill,
      stroke,
      "stroke-width": base * 0.10
    });
  });
}


function drawKitchen(svg, room, base, stroke, fill) {
  const depth = Math.min(room.height * 0.12, room.width * 0.12);
  if (depth < base * 0.8) return;

  add(svg, "rect", {
    x: room.x + base * 0.8,
    y: room.y + base * 0.8,
    width: Math.max(base * 2, room.width - base * 1.6),
    height: depth,
    fill,
    stroke,
    "stroke-width": base * 0.12
  });

  const sinkW = Math.min(room.width * 0.20, base * 3.2);

  add(svg, "rect", {
    x: room.x + room.width / 2 - sinkW / 2,
    y: room.y + base * 0.95,
    width: sinkW,
    height: depth * 0.58,
    rx: base * 0.10,
    fill: "#f8fafc",
    stroke,
    "stroke-width": base * 0.10
  });
}


function drawBathroomFixtures(svg, room, base, stroke, fill) {
  const min = Math.min(room.width, room.height);
  if (min < base * 4) return;

  const toiletW = Math.min(room.width * 0.18, base * 1.7);
  const toiletH = toiletW * 1.35;

  const x = room.x + base * 0.85;
  const y = room.y + base * 0.85;

  add(svg, "rect", {
    x, y,
    width: toiletW,
    height: toiletH * 0.38,
    rx: base * 0.12,
    fill,
    stroke,
    "stroke-width": base * 0.10
  });

  add(svg, "ellipse", {
    cx: x + toiletW / 2,
    cy: y + toiletH * 0.70,
    rx: toiletW * 0.42,
    ry: toiletH * 0.34,
    fill,
    stroke,
    "stroke-width": base * 0.10
  });

  const shower = Math.min(room.width, room.height) * 0.22;
  const sx = room.x + room.width - shower - base * 0.65;
  const sy = room.y + base * 0.65;

  add(svg, "rect", {
    x: sx, y: sy,
    width: shower,
    height: shower,
    fill: "none",
    stroke,
    "stroke-width": base * 0.10
  });

  add(svg, "line", {
    x1: sx, y1: sy,
    x2: sx + shower, y2: sy + shower,
    stroke,
    "stroke-width": base * 0.08
  });

  add(svg, "line", {
    x1: sx + shower, y1: sy,
    x2: sx, y2: sy + shower,
    stroke,
    "stroke-width": base * 0.08
  });
}


function drawUtility(svg, room, base, stroke, fill) {
  const size = Math.min(room.width, room.height) * 0.30;
  if (size < base * 1.5) return;

  const x = room.x + base * 0.7;
  const y = room.y + base * 0.7;

  add(svg, "rect", {
    x, y,
    width: size,
    height: size,
    fill,
    stroke,
    "stroke-width": base * 0.10
  });

  add(svg, "circle", {
    cx: x + size / 2,
    cy: y + size / 2,
    r: size * 0.32,
    fill: "none",
    stroke,
    "stroke-width": base * 0.10
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
    stroke: "#64748b",
    "stroke-width": base * 0.14
  });

  const steps = 7;

  for (let i = 1; i < steps; i++) {
    if (horizontal) {
      const xx = x + (w * i) / steps;

      add(svg, "line", {
        x1: xx, y1: y,
        x2: xx, y2: y + h,
        stroke: "#94a3b8",
        "stroke-width": base * 0.10
      });
    } else {
      const yy = y + (h * i) / steps;

      add(svg, "line", {
        x1: x, y1: yy,
        x2: x + w, y2: yy,
        stroke: "#94a3b8",
        "stroke-width": base * 0.10
      });
    }
  }

  text(svg, cx, cy, floors > 1 ? "UP" : "STAIR", base * 1.4, 700, "#475569");
}


function drawOverallDimensions(svg, plotW, plotH, pad, unit, base) {
  const y = -pad * 0.48;

  add(svg, "line", {
    x1: 0, y1: y,
    x2: plotW, y2: y,
    stroke: "#4b5563",
    "stroke-width": base * 0.13
  });

  add(svg, "line", {
    x1: 0, y1: y - base * 0.65,
    x2: 0, y2: y + base * 0.65,
    stroke: "#4b5563",
    "stroke-width": base * 0.13
  });

  add(svg, "line", {
    x1: plotW, y1: y - base * 0.65,
    x2: plotW, y2: y + base * 0.65,
    stroke: "#4b5563",
    "stroke-width": base * 0.13
  });

  text(svg, plotW / 2, y - base * 0.65, formatDimension(plotW, unit), base * 1.7, 700, "#374151");

  const x = -pad * 0.48;

  add(svg, "line", {
    x1: x, y1: 0,
    x2: x, y2: plotH,
    stroke: "#4b5563",
    "stroke-width": base * 0.13
  });

  add(svg, "line", {
    x1: x - base * 0.65, y1: 0,
    x2: x + base * 0.65, y2: 0,
    stroke: "#4b5563",
    "stroke-width": base * 0.13
  });

  add(svg, "line", {
    x1: x - base * 0.65, y1: plotH,
    x2: x + base * 0.65, y2: plotH,
    stroke: "#4b5563",
    "stroke-width": base * 0.13
  });

  const label = text(svg, x - base * 0.8, plotH / 2, formatDimension(plotH, unit), base * 1.7, 700, "#374151");
  label.setAttribute("transform", `rotate(-90 ${x - base * 0.8} ${plotH / 2})`);
}


function drawBuildableDimensions(svg, buildable, unit, base) {
  text(
    svg,
    buildable.x + buildable.width / 2,
    buildable.y - base * 0.85,
    `BUILDABLE ${formatDimension(buildable.width, unit)}`,
    base * 1.15,
    600,
    "#9ca3af"
  );
}


function drawRoad(svg, roadSide, plotW, plotH, pad, base) {
  const side = String(roadSide || "north").toLowerCase();

  let x;
  let y;
  let rotation = null;

  if (side === "south") {
    x = plotW / 2;
    y = plotH + pad * 0.34;
  } else if (side === "east") {
    x = plotW + pad * 0.34;
    y = plotH / 2;
    rotation = 90;
  } else if (side === "west") {
    x = -pad * 0.34;
    y = plotH / 2;
    rotation = -90;
  } else {
    x = plotW / 2;
    y = -pad * 0.34;
  }

  const label = text(svg, x, y, `ROAD · ${side.toUpperCase()}`, base * 1.7, 750, "#374151");

  if (rotation !== null) {
    label.setAttribute("transform", `rotate(${rotation} ${x} ${y})`);
  }
}


function drawNorthArrow(svg, plotW, pad, base) {
  const x = plotW - pad * 0.45;
  const y = pad * 0.32;

  const g = add(svg, "g", {
    transform: `translate(${x} ${y})`
  });

  add(g, "line", {
    x1: 0, y1: base * 1.8,
    x2: 0, y2: -base * 1.4,
    stroke: "#111827",
    "stroke-width": base * 0.20
  });

  add(g, "path", {
    d:
      `M 0 ${-base * 2.1} ` +
      `L ${-base * 0.65} ${-base * 0.75} ` +
      `L ${base * 0.65} ${-base * 0.75} Z`,
    fill: "#111827"
  });

  text(g, 0, -base * 2.7, "N", base * 1.8, 800);
}


function drawTitleBlock(svg, plotW, plotH, pad, base, info) {
  const y = plotH + pad * 0.58;

  text(
    svg,
    plotW / 2,
    y,
    info.title || "Architectural Concept",
    base * 2.0,
    800,
    "#111827"
  );

  const details = [
    info.country ? `Profile: ${capitalize(info.country)}` : null,
    info.strategy ? `Layout: ${info.strategy}` : null,
    "Concept plan · verify with licensed architect/engineer"
  ]
    .filter(Boolean)
    .join(" · ");

  text(
    svg,
    plotW / 2,
    y + base * 2.2,
    details,
    base * 1.15,
    550,
    "#6b7280"
  );

  if (Array.isArray(info.adaptations) && info.adaptations.length) {
    const summary = info.adaptations
      .map(item => item.room)
      .filter(Boolean)
      .join(", ");

    if (summary) {
      text(
        svg,
        plotW / 2,
        y + base * 3.9,
        `Compact-plan adaptation: ${summary}`,
        base * 1.05,
        550,
        "#9ca3af"
      );
    }
  }
}


function buyerFill(type) {
  const fills = {
    living: "#e8f1fb",
    familyLounge: "#eef5fb",
    dining: "#edf6fb",
    kitchen: "#eaf6ec",
    bedroom: "#f1edfb",
    masterBedroom: "#ebe7f7",
    attachedToilet: "#fbf3df",
    commonToilet: "#fbf3df",
    utility: "#f1f7e7",
    puja: "#e8f7f3",
    store: "#f3f4f6"
  };

  return fills[type] || "#ffffff";
}


function isBathroom(type) {
  return (
    type === "attachedToilet" ||
    type === "commonToilet" ||
    type === "bath"
  );
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

  return `${feet}'${inches ? `-${inches}"` : '-0"'}`;
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
