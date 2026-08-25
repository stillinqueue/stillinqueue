export function calculateBuildableArea(requirements) {
  const plot = requirements.plot || {};
  const setbacks = requirements.setbacks || {};

  const width = Number(plot.width);
  const height = Number(plot.height);

  if (!Number.isFinite(width) || width <= 0) {
    throw new Error("Plot width must be a positive number.");
  }

  if (!Number.isFinite(height) || height <= 0) {
    throw new Error("Plot height must be a positive number.");
  }

  const front = Number(setbacks.front || 0);
  const rear = Number(setbacks.rear || 0);
  const left = Number(setbacks.left || 0);
  const right = Number(setbacks.right || 0);

  const allSetbacks = [front, rear, left, right];

  if (allSetbacks.some(value => !Number.isFinite(value) || value < 0)) {
    throw new Error("Setbacks must be zero or positive numbers.");
  }

  const buildableWidth =
    width - left - right;

  const buildableHeight =
    height - front - rear;

  if (buildableWidth <= 0 || buildableHeight <= 0) {
    throw new Error(
      "The selected setbacks leave no usable buildable area."
    );
  }

  const plotArea =
    width * height;

  const buildableArea =
    buildableWidth * buildableHeight;

  const coveragePercent =
    (buildableArea / plotArea) * 100;

  return {
    plot: {
      width,
      height,
      area: round(plotArea),
      unit: plot.unit || "ft"
    },

    setbacks: {
      front,
      rear,
      left,
      right
    },

    buildable: {
      x: left,
      y: front,

      width: round(buildableWidth),
      height: round(buildableHeight),

      area: round(buildableArea)
    },

    coveragePercent:
      round(coveragePercent)
  };
}


function round(value, decimals = 2) {
  const factor = 10 ** decimals;

  return Math.round(value * factor) / factor;
}
