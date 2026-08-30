import assert from "node:assert/strict";
import test from "node:test";

import { buildAccessibilityReport } from "./accessibility.js";
import { generateLayout } from "./layout-planner.js";

const baseLayout = {
  buildableArea: { x: 0, y: 0, width: 20, height: 20 },
  entrances: [{ id: "entry", roomId: "living", side: "north" }],
  circulation: [],
  rooms: [
    { id: "living", name: "Living", type: "living", x: 0, y: 0, width: 10, height: 10, requiresCirculationAccess: true },
    { id: "bedroom", name: "Bedroom", type: "bedroom", x: 0, y: 10, width: 10, height: 10, requiresCirculationAccess: true }
  ]
};

test("rejects a common toilet whose only route is through a bedroom", () => {
  const layout = {
    ...baseLayout,
    rooms: [
      ...baseLayout.rooms,
      { id: "common", name: "Common Toilet", type: "commonToilet", x: 10, y: 10, width: 10, height: 10, requiresCirculationAccess: true }
    ]
  };

  const report = buildAccessibilityReport(layout);
  assert.equal(report.valid, false);
  assert.deepEqual(report.inaccessibleCommonToilets.map(room => room.id), ["common"]);
});

test("accepts a common toilet reached from a public room", () => {
  const layout = {
    ...baseLayout,
    rooms: [
      ...baseLayout.rooms,
      { id: "common", name: "Common Toilet", type: "commonToilet", x: 10, y: 0, width: 10, height: 10, requiresCirculationAccess: true }
    ]
  };

  const report = buildAccessibilityReport(layout);
  assert.equal(report.valid, true);
  assert.equal(report.connections.find(item => item.roomId === "common")?.fromId, "living");
});

test("rejects an entrance that is not on the stated exterior side", () => {
  const report = buildAccessibilityReport({
    ...baseLayout,
    entrances: [{ id: "entry", roomId: "bedroom", side: "north" }]
  });

  assert.equal(report.valid, false);
  assert.deepEqual(report.invalidEntranceIds, ["entry"]);
});

test("generated 4BHK gives the common toilet a non-private route", () => {
  const layout = generateLayout({
    country: "india",
    plot: { width: 60, height: 80, unit: "ft", roadSide: "north" },
    setbacks: { front: 10, rear: 5, left: 4, right: 4 },
    house: { bhk: 4, floors: 1 },
    preferences: {}
  });

  assert.equal(layout.success, true);
  const connection = layout.accessibilityReport.connections.find(item => item.roomId === "common-toilet");
  assert.ok(connection);
  const source = layout.rooms.find(room => room.id === connection.fromId);
  assert.ok(connection.fromCirculation || !["bedroom", "masterBedroom", "attachedToilet"].includes(source?.type));
});