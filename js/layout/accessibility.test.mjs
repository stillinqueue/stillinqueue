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

test("applies exact room dimensions and a scoped bedroom reduction", () => {
  const layout = generateLayout({
    country: "india",
    plot: { width: 60, height: 80, unit: "ft", roadSide: "north" },
    setbacks: { front: 10, rear: 5, left: 4, right: 4 },
    house: { bhk: 3, floors: 1 },
    preferences: {
      familyLounge: false,
      roomConstraints: [{ room: "masterBedroom", width: 14, depth: 16, area: null, area_delta: null, unit: "ft" }],
      roomScales: { bedroom3: 0.86 }
    }
  });

  assert.equal(layout.success, true);
  const master = layout.rooms.find(room => room.id === "bedroom-1");
  assert.deepEqual([master.width, master.height], [14, 16]);
  assert.equal(layout.constraintReport.find(result => result.roomId === "bedroom-1").status, "applied");
  assert.equal(layout.constraintReport.some(result => result.roomId === "bedroom-2"), false);
});

test("transfers a requested area increase without changing total internal area", () => {
  const requirements = {
    country: "india",
    plot: { width: 60, height: 80, unit: "ft", roadSide: "north" },
    setbacks: { front: 10, rear: 5, left: 4, right: 4 },
    house: { bhk: 3, floors: 1 },
    preferences: { familyLounge: false }
  };
  const before = generateLayout(requirements);
  const after = generateLayout({
    ...requirements,
    preferences: {
      ...requirements.preferences,
      roomConstraints: [{ room: "living", width: null, depth: null, area: null, area_delta: 40, unit: "ft" }]
    }
  });

  const beforeLiving = before.rooms.find(room => room.id === "living");
  const afterLiving = after.rooms.find(room => room.id === "living");
  assert.equal(after.success, true);
  assert.ok(Math.abs(afterLiving.area - beforeLiving.area - 40) < 0.2);
  assert.ok(Math.abs(after.areaSummary.calculatedInternalArea - before.areaSummary.calculatedInternalArea) < 0.2);
});

test("creates an exterior balcony connected to living", () => {
  const layout = generateLayout({
    country: "india",
    plot: { width: 60, height: 80, unit: "ft", roadSide: "north" },
    setbacks: { front: 10, rear: 5, left: 4, right: 4 },
    house: { bhk: 3, floors: 1 },
    preferences: {
      familyLounge: false,
      balcony: true,
      roomAdjacency: [{ room: "balcony", preference: "connected to living" }]
    }
  });

  assert.equal(layout.success, true);
  assert.equal(layout.validationReport.exteriorBalconyErrors.length, 0);
  assert.equal(layout.adjacencyReport[0].outcome, "applied");
  assert.ok(layout.areaSummary.balconyArea > 0);
});

test("rolls back an unsafe explicit room swap", () => {
  const layout = generateLayout({
    country: "india",
    plot: { width: 60, height: 80, unit: "ft", roadSide: "north" },
    setbacks: { front: 10, rear: 5, left: 4, right: 4 },
    house: { bhk: 3, floors: 1 },
    preferences: {
      familyLounge: false,
      roomAdjacency: [{ room: "kitchen", preference: "swap with bedroom 2" }]
    }
  });

  assert.equal(layout.success, true);
  assert.equal(layout.adjacencyReport[0].outcome, "not-feasible");
  assert.deepEqual(layout.validationReport.errors, []);
});

test("keeps the master bedroom accessible through the compact rear landing", () => {
  const layout = generateLayout({
    country: "india",
    plot: { width: 30, height: 44, unit: "ft", roadSide: "north" },
    setbacks: { front: 5, rear: 4, left: 3, right: 3 },
    house: { bhk: 3, floors: 1 },
    preferences: { familyLounge: false }
  });

  assert.equal(layout.accessibilityReport.inaccessibleRooms.some(room => room.id === "bedroom-1"), false);
  assert.equal(layout.circulation.find(item => item.id === "lobby-rear")?.overlay, true);
});

test("does not grow rooms across the legacy circulation spine", () => {
  const layout = generateLayout({
    country: "india",
    plot: { width: 60, height: 40, unit: "ft", roadSide: "north" },
    setbacks: { front: 5, rear: 4, left: 4, right: 4 },
    house: { bhk: 3, floors: 1 },
    preferences: {
      familyLounge: false,
      roomConstraints: [{ room: "masterBedroom", width: 14, depth: 16, area: null, area_delta: null, unit: "ft" }]
    }
  });

  assert.equal(layout.accessibilityReport.inaccessibleRooms.some(room => room.id === "bedroom-1"), false);
  assert.equal(layout.entrances[0]?.roomId, "living");
});

test("creates a valid common-toilet route for a comfortable 40 by 50 4BHK", () => {
  const layout = generateLayout({
    country: "india",
    plot: { width: 40, height: 50, unit: "ft", roadSide: "north" },
    setbacks: { front: 3, rear: 2, left: 2, right: 2 },
    house: { bhk: 4, floors: 1 },
    preferences: {}
  });

  assert.equal(layout.feasibility.status, "comfortable");
  assert.equal(layout.success, true);
  assert.equal(layout.accessibilityReport.inaccessibleCommonToilets.length, 0);
  assert.ok(layout.accessibilityReport.connections.some(connection => connection.roomId === "common-toilet"));
});

const areaEditBase = {
  country: "india",
  plot: { width: 60, height: 80, unit: "ft", roadSide: "north" },
  setbacks: { front: 10, rear: 5, left: 4, right: 4 },
  house: { bhk: 4, floors: 1 },
  preferences: {}
};

const areaOperation = (operation, sourceRoom, targetRoom, overrides = {}) => ({
  operation,
  source_room: sourceRoom,
  target_room: targetRoom,
  donor_room: null,
  side: null,
  width: null,
  depth: null,
  area: null,
  amount_sqft: null,
  amount_percent: null,
  requested_width: null,
  requested_depth: null,
  priority: "normal",
  preserve_total_area: true,
  preserve_room_usability: true,
  reason: "Regression test",
  ...overrides
});

function editCurrentLayout(currentLayout, operation, extraPreferences = {}) {
  return generateLayout({
    ...areaEditBase,
    currentLayout,
    preferences: { ...extraPreferences, layoutOperations: operation ? [operation] : [] }
  });
}

function assertConservedOperation(layout, tolerance = 0.2) {
  const result = layout.operationReport[0];
  const roomDelta = result.changes.reduce((sum, change) => sum + change.delta, 0);
  const circulationDelta = result.circulation_changes.reduce(
    (sum, change) => sum + change.conservation_delta,
    0
  );
  assert.ok(Math.abs(roomDelta + circulationDelta) <= tolerance);
  assert.ok(Math.abs(result.total_donor_loss - result.total_recipient_gain - result.circulation_area_change) <= tolerance);
  assert.ok(Math.abs(result.residual_difference) <= tolerance);
  assert.deepEqual(result.footprint_after, result.footprint_before);
  assert.equal(result.footprint_changed, false);
  assert.deepEqual(layout.validationReport.overlaps, []);
  assert.equal(layout.accessibilityReport.valid, true);
}

test("transfers released Bedroom 3 area to Family Lounge", () => {
  const initial = generateLayout(areaEditBase);
  const edited = editCurrentLayout(initial, areaOperation("transfer_area", "bedroom3", "familyLounge", {
    requested_width: 10,
    requested_depth: 11
  }));
  const bedroom = edited.rooms.find(room => room.id === "bedroom-3");
  const beforeLounge = initial.rooms.find(room => room.id === "family-lounge");
  const afterLounge = edited.rooms.find(room => room.id === "family-lounge");
  const result = edited.operationReport[0];
  const change = roomId => result.changes.find(item => item.room_id === roomId);

  assert.equal(edited.success, true);
  assert.deepEqual([bedroom.width, bedroom.height], [10, 11]);
  assert.ok(afterLounge.area > beforeLounge.area);
  assert.equal(edited.areaSummary.calculatedInternalArea, initial.areaSummary.calculatedInternalArea);
  assert.equal(result.status, "applied");
  assert.deepEqual(change("bedroom-3"), {
    room: "Bedroom 3",
    room_id: "bedroom-3",
    before_area: 405.6,
    after_area: 110,
    delta: -295.6
  });
  assert.deepEqual(change("family-lounge"), {
    room: "Family Lounge",
    room_id: "family-lounge",
    before_area: 297.44,
    after_area: 593.02,
    delta: 295.58
  });
  assert.deepEqual(change("living"), {
    room: "Living Room",
    room_id: "living",
    before_area: 446.16,
    after_area: 150.58,
    delta: -295.58
  });
  assert.deepEqual(change("bedroom-4"), {
    room: "Bedroom 4",
    room_id: "bedroom-4",
    before_area: 405.6,
    after_area: 655.2,
    delta: 249.6
  });
  assert.equal(result.circulation_changes[0].delta, 46);
  assert.equal(result.total_donor_loss, 591.18);
  assert.equal(result.total_recipient_gain, 545.18);
  assert.equal(result.circulation_area_change, 46);
  assert.equal(result.residual_difference, 0);
  assert.match(result.reason, /Donor losses: Living Room, Bedroom 3/);
  assertConservedOperation(edited);
});

test("auto-selects Dining to enlarge Kitchen by about twenty percent", () => {
  const initial = generateLayout(areaEditBase);
  const edited = editCurrentLayout(initial, areaOperation("redistribute_area", null, "kitchen", { amount_percent: 20 }));
  const beforeKitchen = initial.rooms.find(room => room.id === "kitchen");
  const afterKitchen = edited.rooms.find(room => room.id === "kitchen");

  assert.ok(afterKitchen.area >= beforeKitchen.area * 1.19);
  assert.match(edited.operationReport[0].reason, /Dining/);
  assert.equal(edited.areaSummary.calculatedInternalArea, initial.areaSummary.calculatedInternalArea);
  assertConservedOperation(edited);
});

test("enlarges Living without reducing any bedroom", () => {
  const initial = generateLayout(areaEditBase);
  const edited = editCurrentLayout(initial, areaOperation("redistribute_area", null, "living", { amount_percent: 8 }));
  assert.ok(edited.rooms.find(room => room.id === "living").area > initial.rooms.find(room => room.id === "living").area);
  for (const bedroom of edited.rooms.filter(room => ["bedroom", "masterBedroom"].includes(room.type))) {
    const before = initial.rooms.find(room => room.id === bedroom.id);
    assert.equal(bedroom.area, before.area);
  }
  assertConservedOperation(edited);
});

test("interprets a little Bedroom 2 area as a conservative Dining transfer", () => {
  const initial = generateLayout(areaEditBase);
  const edited = editCurrentLayout(initial, areaOperation("transfer_area", "bedroom2", "dining", { amount_percent: 8 }));
  assert.ok(edited.rooms.find(room => room.id === "bedroom-2").area < initial.rooms.find(room => room.id === "bedroom-2").area);
  assert.ok(edited.rooms.find(room => room.id === "dining").area > initial.rooms.find(room => room.id === "dining").area);
  assert.equal(edited.operationReport[0].status, "applied");
  assertConservedOperation(edited);
});

test("applies exact bedroom constraints before Family Lounge surplus", () => {
  const initial = generateLayout(areaEditBase);
  const constraints = [
    { room: "bedroom2", width: 12, depth: 14, area: null, area_delta: null, unit: "ft" },
    { room: "bedroom3", width: 10, depth: 12, area: null, area_delta: null, unit: "ft" }
  ];
  const constrained = editCurrentLayout(initial, null, { roomConstraints: constraints });
  const edited = editCurrentLayout(constrained, areaOperation("redistribute_area", null, "familyLounge", { priority: "high" }), { roomConstraints: constraints });

  assert.deepEqual([edited.rooms.find(room => room.id === "bedroom-2").width, edited.rooms.find(room => room.id === "bedroom-2").height], [12, 14]);
  assert.deepEqual([edited.rooms.find(room => room.id === "bedroom-3").width, edited.rooms.find(room => room.id === "bedroom-3").height], [10, 12]);
  assert.ok(edited.rooms.find(room => room.id === "family-lounge").area > constrained.rooms.find(room => room.id === "family-lounge").area);
  assert.equal(edited.areaSummary.calculatedInternalArea, constrained.areaSummary.calculatedInternalArea);
  assertConservedOperation(edited);
});

test("proposes practical improvements without changing geometry", () => {
  const initial = generateLayout(areaEditBase);
  const reviewed = editCurrentLayout(initial, areaOperation("optimize_layout", null, null));
  assert.equal(reviewed.operationReport[0].status, "proposed");
  assert.equal(reviewed.operationReport[0].confirmation_required, true);
  assert.deepEqual(
    reviewed.rooms.map(room => [room.id, room.x, room.y, room.width, room.height]),
    initial.rooms.map(room => [room.id, room.x, room.y, room.width, room.height])
  );
});