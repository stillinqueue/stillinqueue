export function renderDebugLayout(layout, container) {
  if (!container) {
    throw new Error("Debug renderer container was not found.");
  }

  container.innerHTML = "";

  if (!layout?.success) {
    container.innerHTML = `
      <div style="
        padding:16px;
        border:1px solid #d33;
        background:#fff5f5;
        color:#a00;
        font-family:Arial,sans-serif;
      ">
        Layout could not be generated.
      </div>
    `;

    return;
  }

  const plot = layout.plot;
  const buildable = layout.buildableArea;

  const padding = 50;

  const maxWidth = 900;
  const maxHeight = 900;

  const scaleX =
    (maxWidth - padding * 2) /
    plot.width;

  const scaleY =
    (maxHeight - padding * 2) /
    plot.height;

  const scale =
    Math.min(scaleX, scaleY);

  const svgWidth =
    plot.width * scale +
    padding * 2;

  const svgHeight =
    plot.height * scale +
    padding * 2;

  const toX = value =>
    padding + value * scale;

  const toY = value =>
    padding + value * scale;

  const toSize = value =>
    value * scale;

  const roomSvg =
    layout.rooms
      .map(room => {
        const x = toX(room.x);
        const y = toY(room.y);

        const width =
          toSize(room.width);

        const height =
          toSize(room.height);

        const centerX =
          x + width / 2;

        const centerY =
          y + height / 2;

        return `
          <g>
            <rect
              x="${x}"
              y="${y}"
              width="${width}"
              height="${height}"
              fill="white"
              stroke="black"
              stroke-width="2"
            />

            <text
              x="${centerX}"
              y="${centerY - 7}"
              text-anchor="middle"
              font-size="12"
              font-family="Arial, sans-serif"
              font-weight="600"
            >
              ${escapeHtml(room.name)}
            </text>

            <text
              x="${centerX}"
              y="${centerY + 10}"
              text-anchor="middle"
              font-size="11"
              font-family="Arial, sans-serif"
            >
              ${formatDimension(room.width)}
              ×
              ${formatDimension(room.height)}
            </text>
          </g>
        `;
      })
      .join("");

  const corridorSvg =
    layout.circulation
      .map(corridor => {
        return `
          <g>
            <rect
              x="${toX(corridor.x)}"
              y="${toY(corridor.y)}"
              width="${toSize(corridor.width)}"
              height="${toSize(corridor.height)}"
              fill="#eeeeee"
              stroke="#666666"
              stroke-width="1.5"
              stroke-dasharray="5 3"
            />

            <text
              x="${
                toX(corridor.x) +
                toSize(corridor.width) / 2
              }"
              y="${
                toY(corridor.y) +
                toSize(corridor.height) / 2
              }"
              text-anchor="middle"
              font-size="10"
              font-family="Arial, sans-serif"
              transform="
                rotate(
                  -90
                  ${
                    toX(corridor.x) +
                    toSize(corridor.width) / 2
                  }
                  ${
                    toY(corridor.y) +
                    toSize(corridor.height) / 2
                  }
                )
              "
            >
              PASSAGE
            </text>
          </g>
        `;
      })
      .join("");

  const roadSvg =
    renderRoadSide(
      layout.roadSide,
      plot,
      padding,
      scale
    );

  container.innerHTML = `
    <svg
      viewBox="0 0 ${svgWidth} ${svgHeight}"
      width="100%"
      style="
        max-width:${svgWidth}px;
        background:white;
        border:1px solid #ccc;
      "
    >

      ${roadSvg}

      <!-- Plot boundary -->
      <rect
        x="${toX(0)}"
        y="${toY(0)}"
        width="${toSize(plot.width)}"
        height="${toSize(plot.height)}"
        fill="none"
        stroke="#444"
        stroke-width="2"
      />

      <!-- Buildable boundary -->
      <rect
        x="${toX(buildable.x)}"
        y="${toY(buildable.y)}"
        width="${toSize(buildable.width)}"
        height="${toSize(buildable.height)}"
        fill="none"
        stroke="#888"
        stroke-width="1"
        stroke-dasharray="6 4"
      />

      ${corridorSvg}

      ${roomSvg}

      <!-- Plot dimensions -->
      <text
        x="${toX(plot.width / 2)}"
        y="${toY(0) - 12}"
        text-anchor="middle"
        font-size="13"
        font-family="Arial, sans-serif"
      >
        ${formatDimension(plot.width)}
      </text>

      <text
        x="${toX(0) - 15}"
        y="${toY(plot.height / 2)}"
        text-anchor="middle"
        font-size="13"
        font-family="Arial, sans-serif"
        transform="
          rotate(
            -90
            ${toX(0) - 15}
            ${toY(plot.height / 2)}
          )
        "
      >
        ${formatDimension(plot.height)}
      </text>

    </svg>

    <div style="
      margin-top:12px;
      font-family:Arial,sans-serif;
      font-size:13px;
    ">
      <strong>Status:</strong>
      ${layout.success ? "Layout generated" : "Failed"}
      &nbsp; | &nbsp;

      <strong>Rooms:</strong>
      ${layout.statistics.placedRooms}
      /
      ${layout.statistics.requestedRooms}
      &nbsp; | &nbsp;

      <strong>Country:</strong>
      ${escapeHtml(layout.country)}
      &nbsp; | &nbsp;

      <strong>Unit:</strong>
      ${escapeHtml(layout.unit)}
    </div>
  `;
}


function renderRoadSide(
  roadSide,
  plot,
  padding,
  scale
) {
  const width =
    plot.width * scale;

  const height =
    plot.height * scale;

  const left = padding;
  const top = padding;

  const roadOffset = 22;

  switch (roadSide) {
    case "south":
      return `
        <text
          x="${left + width / 2}"
          y="${top + height + roadOffset}"
          text-anchor="middle"
          font-size="12"
          font-family="Arial, sans-serif"
        >
          ROAD - SOUTH
        </text>
      `;

    case "east":
      return `
        <text
          x="${left + width + roadOffset}"
          y="${top + height / 2}"
          text-anchor="middle"
          font-size="12"
          font-family="Arial, sans-serif"
          transform="
            rotate(
              90
              ${left + width + roadOffset}
              ${top + height / 2}
            )
          "
        >
          ROAD - EAST
        </text>
      `;

    case "west":
      return `
        <text
          x="${left - roadOffset}"
          y="${top + height / 2}"
          text-anchor="middle"
          font-size="12"
          font-family="Arial, sans-serif"
          transform="
            rotate(
              -90
              ${left - roadOffset}
              ${top + height / 2}
            )
          "
        >
          ROAD - WEST
        </text>
      `;

    case "north":
    default:
      return `
        <text
          x="${left + width / 2}"
          y="${top - roadOffset}"
          text-anchor="middle"
          font-size="12"
          font-family="Arial, sans-serif"
        >
          ROAD - NORTH
        </text>
      `;
  }
}


function formatDimension(value) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return "";
  }

  return Number.isInteger(number)
    ? String(number)
    : number.toFixed(1);
}


function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
