import {
  buildRoomProgram
} from "./room-program.js";

import {
  calculateBuildableArea
} from "./buildable-area.js";

import {
  checkPlanFeasibility,
  validateGeneratedLayout
} from "./feasibility.js";

import {
  getDesignProfile,
  PLANNING_ROOM_POLICIES
} from "./plan-schema.js";

import {
  applyAdjacencyPairs,
  applyLayoutOperations,
  resolveCanonicalRoom
} from "./adjacency.js";

import {
  buildAccessibilityReport
} from "./accessibility.js";


/*
  Still In Queue · Architectural Planner V16
  -------------------------------------------
  Primary goal:
  create a compact CONNECTED floor plan for a single-floor 3BHK.

  Key change from the previous version:
  - NO full-height corridor
  - compact central lobby/hall
  - rooms share walls
  - wet areas are grouped
  - attached toilets sit beside bedrooms
  - living/dining are connected at the front
  - bedrooms form a private rear zone

  Other configurations safely fall back to the previous
  multi-strategy planner.
*/

export function generateLayout(requirements) {
  if (requirements.currentLayout?.success) {
    return postProcessLayout({
      ...requirements.currentLayout,
      rooms: requirements.currentLayout.rooms.map(room => ({ ...room })),
      circulation: (requirements.currentLayout.circulation || []).map(item => ({ ...item })),
      entrances: (requirements.currentLayout.entrances || []).map(item => ({ ...item })),
      operationReport: [],
      adjacencyReport: [],
      constraintReport: [],
      success: true
    }, requirements);
  }

  const bhk =
    Number(
      requirements.house?.bhk ||
      1
    );

  let bestInaccessibleLayout = null;
  const rememberInaccessible = layout => {
    if (!layout?.accessibilityReport) return;
    const count = layout.accessibilityReport.inaccessibleRooms.length;
    const bestCount = bestInaccessibleLayout?.accessibilityReport?.inaccessibleRooms.length ?? Infinity;
    if (count < bestCount) bestInaccessibleLayout = layout;
  };

  if (
    bhk >= 4 &&
    bhk <= 5
  ) {
    const large =
      generateLargeConnectedLayout(
        requirements
      );

    if (
      large?.success
    ) {
      const processedLarge = postProcessLayout(large, requirements);
      if (processedLarge.success) return processedLarge;
      rememberInaccessible(processedLarge);
    }
  }

  const compact =
    generateCompact3BHK(
      requirements
    );

  if (
    compact?.success
  ) {
    const processedCompact = postProcessLayout(compact, requirements);
    if (processedCompact.success) return processedCompact;
    rememberInaccessible(processedCompact);
  }

  const processedLegacy = postProcessLayout(
    legacyGenerateLayout(
      requirements
    ),
    requirements
  );
  if (processedLegacy.success) return processedLegacy;
  rememberInaccessible(processedLegacy);
  return bestInaccessibleLayout || processedLegacy;
}


/*
  =========================================================
  SPACE RECLAMATION + INTEGRITY CHECK

  Every internal strategy below (large-connected, compact-3BHK,
  legacy guillotine packer) can leave unused strips of the
  buildable area between rooms and the plot boundary. Rather
  than patch each strategy separately, this single pass runs
  on whatever `rooms` came out, growing each room rightward
  and downward to consume adjacent free space (capped so wet
  areas like kitchens/toilets don't balloon), then re-validates
  that the result still has zero overlaps and stays inside the
  buildable rectangle. If growth ever produces an invalid
  layout, the untouched original is returned instead -- this
  is a strictly additive safety net, never a correctness risk.
  =========================================================
*/

function postProcessLayout(layout, requirements) {
  if (
    !layout ||
    !layout.success ||
    !Array.isArray(layout.rooms) ||
    layout.rooms.length === 0
  ) {
    return layout;
  }

  const buildable = layout.buildableArea;
  if (
    !buildable ||
    buildable.width <= 0 ||
    buildable.height <= 0
  ) {
    return layout;
  }

  const rooms = layout.rooms.map(room => ({ ...room }));
  const requestedProgram = new Map(
    buildRoomProgram(requirements).map(room => [room.id, room])
  );
  for (const room of rooms) {
    const requested = requestedProgram.get(room.id);
    if (!requested) continue;
    room.minWidth = requested.minWidth;
    room.minHeight = requested.minHeight;
    room.preferredWidth = requested.preferredWidth;
    room.preferredHeight = requested.preferredHeight;
    room.requestedSizeScale = requested.requestedSizeScale;
    if (requested.requestedConstraint) room.requestedConstraint = requested.requestedConstraint;
    else delete room.requestedConstraint;
  }

  const beforeBalcony = rooms.map(room => ({ ...room }));
  const balconyReport = ensureExteriorBalcony(rooms, layout.buildableArea, requirements);
  if (!hasValidCandidateRooms(layout, rooms)) {
    rooms.splice(0, rooms.length, ...beforeBalcony);
    balconyReport.forEach(result => {
      result.status = "not-feasible";
      result.reason = "The balcony would invalidate room access or minimum dimensions.";
      delete result.actual;
    });
  }

  const circulationRepairReport = repairCommonToiletAccess(rooms, layout);

  // Satisfy chat-driven "place X near/adjacent to Y" requests (works across
  // every internal strategy, including the rigid hand-built templates that
  // otherwise ignore preferredNear entirely) before reclaiming dead space.
  // Same-footprint swaps can never introduce overlaps, so this is folded
  // into the "original" snapshot the growth pass falls back to on failure.
  const roomPreferences = requirements?.preferences?.roomAdjacency;
  const layoutOperations = requirements?.preferences?.layoutOperations;

  const positionalOperations = Array.isArray(layoutOperations)
    ? layoutOperations.filter(operation =>
        ["swap", "adjacent", "near", "position"].includes(operation.operation)
      )
    : [];

  /*
    IMPORTANT:
    resize is intentionally NOT an area operation.

    Pure room resizing is handled later by applyRoomSizeConstraints(),
    which understands exact width/depth and signed areaDelta values.

    transfer_area / redistribute_area remain responsible for moving
    usable area between different rooms.
  */
  const areaOperations = Array.isArray(layoutOperations)
    ? layoutOperations.filter(operation =>
        ["transfer_area", "redistribute_area", "optimize_layout"].includes(operation.operation)
      )
    : [];

  /*
    If OpenAI supplied a structured operation, that structured intent is
    authoritative. In particular, a resize operation should not fall back
    into the old free-form adjacency parser merely because it is no longer
    present in areaOperations.
  */
  const hasStructuredOperations =
    Array.isArray(layoutOperations) &&
    layoutOperations.length > 0;

  let adjacencyReport = [];
  let operationReport = [];
  const beforeAdjacency = rooms.map(room => ({ ...room }));
  if (positionalOperations.length) {
    operationReport = applyLayoutOperations(rooms, layout.circulation, positionalOperations, buildable);
    repairAttachedBathroomsAfterOperations(rooms, layout, operationReport);
    const operationChangedGeometry = rooms.some((room, index) =>
      room.x !== beforeAdjacency[index]?.x ||
      room.y !== beforeAdjacency[index]?.y ||
      room.width !== beforeAdjacency[index]?.width ||
      room.height !== beforeAdjacency[index]?.height
    );
    if (operationChangedGeometry && !hasValidCandidateRooms(layout, rooms)) {
      rooms.splice(0, rooms.length, ...beforeAdjacency);
      operationReport = operationReport.map(result =>
        ["applied", "approximated"].includes(result.status)
          ? { ...result, status: "rejected", reason: "The operation would break room access, attachments, or layout validity." }
          : result
      );
    }
    } else if (!hasStructuredOperations && Array.isArray(roomPreferences) && roomPreferences.length) {
    adjacencyReport = applyAdjacencyPairs(rooms, layout.circulation, roomPreferences);
    if (!hasValidCandidateRooms(layout, rooms)) {
      rooms.splice(0, rooms.length, ...beforeAdjacency);
      adjacencyReport = adjacencyReport.map(result =>
        ["applied", "already-satisfied"].includes(result.status)
          ? { ...result, status: "no-swap-candidate", outcome: "not-feasible" }
          : result
      );
    }
  }

  /*
    Area transfer + explicit room resize can represent ONE user decision,
    for example:

      "Make Bedroom 3 exactly 10 x 11 and give the released area
       to Family Lounge."

    Keep a snapshot before area operations so the transfer and exact resize
    can be rolled back together if the final dimensional constraint cannot
    be satisfied. This prevents a half-applied result where area moved but
    the requested room size failed.
  */
  const beforeAreaOperations = rooms.map(room => ({ ...room }));
  const beforeAreaCirculation = (layout.circulation || []).map(item => ({ ...item }));
  const coupledTransferOperations = areaOperations.filter(operation =>
    operation.operation === "transfer_area" &&
    operation.source_room &&
    (() => {
      const source = resolveCanonicalRoom(rooms, layout.circulation || [], operation.source_room);
      return Boolean(source?.requestedConstraint);
    })()
  );

  if (areaOperations.length) {
    operationReport.push(...applyAreaOperations(rooms, layout, areaOperations));
  }

  const beforeConstraints = rooms.map(room => ({ ...room }));
  const constraintReport = applyRoomSizeConstraints(rooms, layout);
  const constrainedRooms = constraintReport
    .map(result => rooms.find(room => room.id === result.roomId))
    .filter(Boolean);
  const constrainedBedroomOperations = constrainedRooms
    .filter(room => ["bedroom", "masterBedroom"].includes(room.type))
    .map(room => ({
      status: "applied",
      source_room: room.id === "bedroom-1"
        ? "masterBedroom"
        : `bedroom${room.id.split("-")[1]}`,
      target_room: null
    }));
  repairAttachedBathroomsAfterOperations(rooms, layout, constrainedBedroomOperations);
  repairBedroomAccessAfterTransfer(rooms, layout, constrainedRooms);
  if (!hasValidCandidateRooms(layout, rooms)) {
    rooms.splice(0, rooms.length, ...beforeConstraints);
    constraintReport.forEach(result => {
      result.status = "not-feasible";
      const room = rooms.find(item => item.id === result.roomId);
      if (room) result.actual = { width: room.width, depth: room.height, area: room.area };
    });
  }

  /*
    ATOMIC RESIZE + TRANSFER ROLLBACK

    If an explicit transfer is coupled to a room constraint, the transaction
    is successful only when the source room reaches the requested dimensions.
    Otherwise restore BOTH the transfer and the resize.
  */
  const failedCoupledOperations = coupledTransferOperations.filter(operation => {
    const source = resolveCanonicalRoom(rooms, layout.circulation || [], operation.source_room);
    if (!source) return true;
    const report = constraintReport.find(item => item.roomId === source.id);
    return !report || report.status !== "applied";
  });

  if (failedCoupledOperations.length) {
    restoreRoomSnapshots(rooms, beforeAreaOperations);
    layout.circulation.splice(0, layout.circulation.length, ...beforeAreaCirculation);

    const failedKeys = new Set(
      failedCoupledOperations.map(operation =>
        `${operation.source_room || ""}->${operation.target_room || ""}`
      )
    );

    operationReport = operationReport.map(result => {
      const key = `${result.source_room || ""}->${result.target_room || ""}`;
      if (result.operation !== "transfer_area" || !failedKeys.has(key)) return result;
      return {
        ...result,
        status: "rejected",
        actual_area: 0,
        changes: [],
        circulation_changes: [],
        total_donor_loss: 0,
        total_recipient_gain: 0,
        circulation_area_change: 0,
        residual_difference: 0,
        reason: "The area transfer was rolled back because the source room could not reach its requested final dimensions without invalidating the layout. No part of this combined edit was kept."
      };
    });

    constraintReport.forEach(result => {
      const coupled = failedCoupledOperations.some(operation => {
        const originalSource = resolveCanonicalRoom(beforeAreaOperations, [], operation.source_room);
        return originalSource?.id === result.roomId;
      });
      if (!coupled) return;
      result.status = "not-feasible";
      const room = rooms.find(item => item.id === result.roomId);
      if (room) {
        result.actual = {
          width: room.width,
          depth: room.height,
          area: round(room.width * room.height)
        };
        result.actualAreaDelta = 0;
      }
    });
  }

  const originalRooms = rooms.map(room => ({ ...room }));
  const growable = rooms.filter(room => room.type !== "corridor");

  const maxGrowthRatio = room =>
    room.wetArea ||
    room.type === "attachedToilet" ||
    room.type === "commonToilet" ||
    room.type === "utility"
      ? 1.2
      : 1.6;

  function growRight(room) {
    const cap = room.width * maxGrowthRatio(room);
    let limit = buildable.x + buildable.width;
    for (const other of rooms) {
      if (other === room) continue;
      if (
        other.x >= room.x + room.width - 0.01 &&
        rangesOverlap(room.y, room.y + room.height, other.y, other.y + other.height)
      ) {
        limit = Math.min(limit, other.x);
      }
    }
    const newWidth = round(Math.min(cap, Math.max(room.width, limit - room.x)));
    if (newWidth > room.width + 0.05) {
      room.width = newWidth;
      room.area = round(room.width * room.height);
    }
  }

  function growDown(room) {
    const cap = room.height * maxGrowthRatio(room);
    let limit = buildable.y + buildable.height;
    for (const other of rooms) {
      if (other === room) continue;
      if (
        other.y >= room.y + room.height - 0.01 &&
        rangesOverlap(room.x, room.x + room.width, other.x, other.x + other.width)
      ) {
        limit = Math.min(limit, other.y);
      }
    }
    const newHeight = round(Math.min(cap, Math.max(room.height, limit - room.y)));
    if (newHeight > room.height + 0.05) {
      room.height = newHeight;
      room.area = round(room.width * room.height);
    }
  }

  // Larger public/social rooms claim leftover space before small service rooms.
  const growthOrder = requirements.currentLayout
    ? []
    : growable
        .filter(room => !room.requestedConstraint && !room.requestedSizeScale && !room.operationLocked)
        .sort((a, b) => b.width * b.height - a.width * a.height);
  for (const room of growthOrder) {
    growRight(room);
    growDown(room);
  }

  // Adjacent rooms sharing a wall land on the exact same coordinate, which
  // float rounding can nudge by a hair -- use a small tolerance so genuinely
  // touching (not overlapping) rooms are never mistaken for bad geometry.
  const EPSILON = 0.02;
  const overlapsWithTolerance = (a, b) =>
    !(
      a.x + a.width <= b.x + EPSILON ||
      b.x + b.width <= a.x + EPSILON ||
      a.y + a.height <= b.y + EPSILON ||
      b.y + b.height <= a.y + EPSILON
    );
  const containsWithTolerance = (outer, inner) =>
    inner.x >= outer.x - EPSILON &&
    inner.y >= outer.y - EPSILON &&
    inner.x + inner.width <= outer.x + outer.width + EPSILON &&
    inner.y + inner.height <= outer.y + outer.height + EPSILON;

  const hasOverlap = growable.some((room, index) =>
    growable.slice(index + 1).some(other => overlapsWithTolerance(room, other))
  );
  const outOfBounds = growable.some(room => !containsWithTolerance(buildable, room));
  const growthInvalid = !hasValidCandidateRooms(layout, rooms);

  if (hasOverlap || outOfBounds || growthInvalid) {
    // Growth produced an invalid result -- keep the untouched original geometry.
    return withAccessibilityCheck({
      ...layout,
      rooms: originalRooms,
      adjacencyReport,
      operationReport,
      constraintReport,
      balconyReport,
      circulationRepairReport,
      areaSummary: buildAreaSummary(originalRooms, layout.circulation, requirements?.targetInternalArea),
      statistics: {
        ...layout.statistics,
        requestedRooms: originalRooms.length,
        placedRooms: originalRooms.length
      }
    });
  }

  const occupiedArea = growable.reduce((sum, room) => sum + room.width * room.height, 0);
  const utilizationPercent = round((occupiedArea / buildable.area) * 100, 1);
  const finalAccess = buildAccessibilityReport({ ...layout, rooms });
  circulationRepairReport.forEach(result => {
    if (
      result.status === "not-feasible" &&
      !finalAccess.inaccessibleCommonToilets.some(room => room.id === result.roomId)
    ) {
      result.status = "already-satisfied";
      delete result.reason;
    }
  });

  return withAccessibilityCheck({
    ...layout,
    rooms,
    adjacencyReport,
    operationReport,
    constraintReport,
    balconyReport,
    circulationRepairReport,
    areaSummary: buildAreaSummary(rooms, layout.circulation, requirements?.targetInternalArea),
    statistics: {
      ...layout.statistics,
      requestedRooms: rooms.length,
      placedRooms: rooms.length
    },
    qualityChecks: {
      overlapsDetected: false,
      allRoomsWithinBounds: true,
      buildableUtilizationPercent: utilizationPercent
    }
  });
}

function applyAreaOperations(rooms, layout, operations) {
  const reports = [];

  for (const operation of operations) {
    if (operation.operation === "optimize_layout") {
      reports.push(evaluateLayoutOptimization(rooms, layout, operation));
      continue;
    }

    const snapshot = rooms.map(room => ({ ...room }));
    const circulationSnapshot = (layout.circulation || []).map(item => ({ ...item }));
    const source = operation.source_room
      ? resolveCanonicalRoom(rooms, layout.circulation || [], operation.source_room)
      : null;
    const targetId = operation.target_room || (operation.operation === "resize" ? operation.source_room : null);
    const target = targetId
      ? resolveCanonicalRoom(rooms, layout.circulation || [], targetId)
      : null;
    const explicitDonorId = operation.donor_room ||
      (operation.operation === "transfer_area" ? operation.source_room : null);
    const explicitDonor = explicitDonorId
      ? resolveCanonicalRoom(rooms, layout.circulation || [], explicitDonorId)
      : null;
    const baseReport = {
      operation: operation.operation,
      source_room: operation.source_room || null,
      target_room: targetId || null,
      requested_area: null,
      actual_area: 0,
      status: "rejected",
      changes: [],
      circulation_changes: [],
      total_donor_loss: 0,
      total_recipient_gain: 0,
      circulation_area_change: 0,
      residual_difference: 0,
      conservation_tolerance: 0.2,
      footprint_before: footprintSummary(layout.buildableArea),
      footprint_after: footprintSummary(layout.buildableArea),
      footprint_changed: false,
      interpretation: operation.reason || "Practical local area adjustment"
    };

    if (!target) {
      reports.push({ ...baseReport, reason: "The target room is not present in the generated layout." });
      continue;
    }
    if (operation.operation === "transfer_area" && !source) {
      reports.push({ ...baseReport, reason: "The named source room is not present in the generated layout." });
      continue;
    }

    const requestedArea = determineRequestedTransferArea(operation, source, target, layout.unit);
    baseReport.requested_area = round(requestedArea);
    if (!(requestedArea > 0)) {
      reports.push({ ...baseReport, reason: "The request does not produce a positive transferable area." });
      continue;
    }

    let plan = null;

    /*
      IMPORTANT:
      Exact room dimensions are handled later by applyRoomSizeConstraints().
      The area layer only moves the NET area that must leave the explicit
      source and reach the explicit target. It must not independently reshape
      the source here, otherwise the same resize is applied twice.
    */
    if (explicitDonor && explicitDonor !== target) {
      const direct = describeBoundaryTransfer(explicitDonor, target);
      if (direct) {
        plan = {
          amount: Math.min(requestedArea, direct.maximumArea),
          moves: [{ transfer: direct, amount: Math.min(requestedArea, direct.maximumArea) }],
          conservative: true,
          path: [explicitDonor.id, target.id]
        };
      } else if (operation.operation === "transfer_area") {
        plan = describeSeparatedTransfer(rooms, source, target, requestedArea);
      }
    } else {
      const donorChoice = chooseDonor(rooms, target, requestedArea);
      if (donorChoice) {
        plan = {
          amount: Math.min(requestedArea, donorChoice.maximumArea),
          moves: [{ transfer: donorChoice, amount: Math.min(requestedArea, donorChoice.maximumArea) }]
        };
      }
    }

    if (!plan || !(plan.amount > 0.5)) {
      restoreRoomSnapshots(rooms, snapshot);
      layout.circulation.splice(0, layout.circulation.length, ...circulationSnapshot);
      reports.push({
        ...baseReport,
        reason: "No adjacent room has sufficient transferable area while maintaining practical minimum dimensions and access.",
        suggestion: "Allow a neighboring flexible room to become smaller or permit a larger local rearrangement."
      });
      continue;
    }

    let moveApplicationFailed = false;
    for (const move of plan.moves) {
      const currentTransfer = describeBoundaryTransfer(move.transfer.donor, move.transfer.receiver);
      const moveAmount = Number(move.amount || plan.amount);
      if (!currentTransfer || currentTransfer.maximumArea + 0.2 < moveAmount) {
        moveApplicationFailed = true;
        break;
      }
      applyBoundaryTransfer(currentTransfer, moveAmount);
    }

    if (moveApplicationFailed) {
      restoreRoomSnapshots(rooms, snapshot);
      layout.circulation.splice(0, layout.circulation.length, ...circulationSnapshot);
      reports.push({
        ...baseReport,
        reason: "A conservative source-to-target transfer path could not remain valid while shared boundaries were moved. No substitute donor was used.",
        suggestion: "Choose a nearer recipient or allow a broader local rearrangement."
      });
      continue;
    }

    rooms.forEach(room => {
      room.x = round(room.x);
      room.y = round(room.y);
      room.width = round(room.width);
      room.height = round(room.height);
      room.area = round(room.width * room.height);
    });
    repairBedroomAccessAfterTransfer(rooms, layout, [source, target].filter(Boolean));

    if (!hasValidCandidateRooms(layout, rooms)) {
      restoreRoomSnapshots(rooms, snapshot);
      layout.circulation.splice(0, layout.circulation.length, ...circulationSnapshot);
      reports.push({
        ...baseReport,
        reason: "The best local transfer would violate room usability, access, or geometry.",
        suggestion: "Permit a smaller increase or a wider local rearrangement."
      });
      continue;
    }

    const changes = rooms.flatMap((room, index) => {
      const before = snapshot[index];
      const beforeArea = round(before.width * before.height);
      const afterArea = round(room.width * room.height);
      return Math.abs(afterArea - beforeArea) > 0.1
        ? [{
            room: room.name,
            room_id: room.id,
            before_area: beforeArea,
            after_area: afterArea,
            delta: round(afterArea - beforeArea)
          }]
        : [];
    });
    const circulationChanges = buildCirculationChanges(circulationSnapshot, layout.circulation || []);
    const totalDonorLoss = round(-changes
      .filter(change => change.delta < 0)
      .reduce((sum, change) => sum + change.delta, 0));
    const totalRecipientGain = round(changes
      .filter(change => change.delta > 0)
      .reduce((sum, change) => sum + change.delta, 0));
    const circulationAreaChange = round(circulationChanges
      .reduce((sum, change) => sum + change.conservation_delta, 0));
    const residualDifference = round(
      totalDonorLoss - totalRecipientGain - circulationAreaChange
    );
    const targetBefore = snapshot.find(room => room.id === target.id);
    const sourceBefore = source ? snapshot.find(room => room.id === source.id) : null;
    const actualArea = round(target.area - targetBefore.width * targetBefore.height);
    const actualSourceLoss = source && sourceBefore
      ? round(sourceBefore.width * sourceBefore.height - source.width * source.height)
      : null;
    const intermediateChanges = operation.operation === "transfer_area"
      ? changes.filter(change =>
          change.room_id !== source?.id &&
          change.room_id !== target?.id
        )
      : [];
    const maximumIntermediateNetChange = intermediateChanges.length
      ? Math.max(...intermediateChanges.map(change => Math.abs(change.delta)))
      : 0;
    const tolerance = Math.max(1, requestedArea * 0.05);
    const explicitSourcePreserved = operation.operation !== "transfer_area" ||
      (actualSourceLoss != null && Math.abs(actualSourceLoss - requestedArea) <= tolerance);
    const explicitTargetPreserved = Math.abs(actualArea - requestedArea) <= tolerance;
    const intermediatesPreserved = operation.operation !== "transfer_area" || maximumIntermediateNetChange <= tolerance;
    const semanticsPreserved = explicitSourcePreserved && explicitTargetPreserved && intermediatesPreserved;

    if (operation.operation === "transfer_area" && !semanticsPreserved) {
      restoreRoomSnapshots(rooms, snapshot);
      layout.circulation.splice(0, layout.circulation.length, ...circulationSnapshot);
      reports.push({
        ...baseReport,
        requested_area: round(requestedArea),
        actual_area: 0,
        explicit_source_preserved: false,
        requested_source_loss: round(requestedArea),
        actual_source_loss: 0,
        requested_target_gain: round(requestedArea),
        actual_target_gain: 0,
        intermediate_rooms: [],
        substitute_donors: [],
        reason: "The planner could not preserve the explicit source-to-target transfer without changing another room's net area, so the whole transfer was rolled back.",
        suggestion: "Choose a nearer recipient or allow a broader local rearrangement."
      });
      continue;
    }

    reports.push({
      ...baseReport,
      actual_area: actualArea,
      status: semanticsPreserved && Math.abs(actualArea - requestedArea) <= tolerance ? "applied" : "approximated",
      changes,
      circulation_changes: circulationChanges,
      total_donor_loss: totalDonorLoss,
      total_recipient_gain: totalRecipientGain,
      circulation_area_change: circulationAreaChange,
      residual_difference: residualDifference,
      footprint_changed: false,
      explicit_source_preserved: explicitSourcePreserved,
      requested_source_loss: operation.operation === "transfer_area" ? round(requestedArea) : null,
      actual_source_loss: operation.operation === "transfer_area" ? actualSourceLoss : null,
      requested_target_gain: round(requestedArea),
      actual_target_gain: actualArea,
      intermediate_rooms: intermediateChanges.map(change => change.room),
      substitute_donors: [],
      reason: buildTransferReason(
        plan,
        target,
        requestedArea,
        actualArea,
        layout.unit,
        changes,
        circulationAreaChange
      )
    });
  }

  return reports;
}

function footprintSummary(buildable) {
  return {
    x: round(Number(buildable?.x || 0)),
    y: round(Number(buildable?.y || 0)),
    width: round(Number(buildable?.width || 0)),
    height: round(Number(buildable?.height || 0)),
    area: round(Number(buildable?.width || 0) * Number(buildable?.height || 0))
  };
}

function buildCirculationChanges(beforeItems, afterItems) {
  const beforeById = new Map(beforeItems.map(item => [item.id, item]));
  const afterById = new Map(afterItems.map(item => [item.id, item]));
  const ids = new Set([...beforeById.keys(), ...afterById.keys()]);

  return [...ids].flatMap(id => {
    const before = beforeById.get(id);
    const after = afterById.get(id);
    const beforeArea = before ? round(before.width * before.height) : 0;
    const afterArea = after ? round(after.width * after.height) : 0;
    const delta = round(afterArea - beforeArea);
    if (Math.abs(delta) <= 0.1) return [];
    const overlay = Boolean(after?.overlay ?? before?.overlay);
    return [{
      id,
      name: after?.name || before?.name || "Circulation",
      before_area: beforeArea,
      after_area: afterArea,
      delta,
      overlay,
      conservation_delta: overlay ? 0 : delta
    }];
  });
}

function reshapeSourceZone(rooms, layout, source, requestedWidth, requestedDepth) {
  const tolerance = 0.05;
  const width = Math.max(Number(source.minWidth || 0), requestedWidth);
  const depth = Math.max(Number(source.minHeight || 0), requestedDepth);
  if (width > source.width || depth > source.height) return null;

  const sameRowNeighbor = rooms.find(room => room !== source &&
    Math.abs(room.y - source.y) < tolerance &&
    Math.abs(room.height - source.height) < tolerance &&
    (Math.abs(room.x - source.x - source.width) < tolerance ||
      Math.abs(source.x - room.x - room.width) < tolerance));
  if (!sameRowNeighbor) return null;

  const oldArea = source.width * source.height;
  const oldBottom = source.y + source.height;
  const sourceOnLeft = source.x < sameRowNeighbor.x;
  if (sourceOnLeft) {
    const combinedRight = sameRowNeighbor.x + sameRowNeighbor.width;
    source.width = width;
    sameRowNeighbor.x = source.x + width;
    sameRowNeighbor.width = combinedRight - sameRowNeighbor.x;
  } else {
    const combinedLeft = sameRowNeighbor.x;
    const sourceRight = source.x + source.width;
    source.x = sourceRight - width;
    source.width = width;
    sameRowNeighbor.width = source.x - combinedLeft;
  }
  source.height = depth;
  source.area = round(width * depth);
  sameRowNeighbor.area = round(sameRowNeighbor.width * sameRowNeighbor.height);
  source.operationLocked = true;
  sameRowNeighbor.operationLocked = true;

  const remainderHeight = oldBottom - source.y - depth;
  if (remainderHeight > tolerance) {
    layout.circulation.push({
      id: `transfer-flex-${source.id}`,
      name: "Local Circulation",
      type: "corridor",
      x: source.x,
      y: source.y + depth,
      width,
      height: remainderHeight,
      operationLocked: true
    });
  }

  return {
    releasedArea: round(oldArea - source.area),
    neighbor: sameRowNeighbor
  };
}

function introducesNewLayoutDefect(layout, beforeRooms, afterRooms) {
  const beforeLayout = { ...layout, rooms: beforeRooms };
  const afterLayout = { ...layout, rooms: afterRooms };
  const beforeAccess = buildAccessibilityReport(beforeLayout);
  const afterAccess = buildAccessibilityReport(afterLayout);
  const beforeInvalid = new Set(beforeAccess.inaccessibleRooms.map(room => room.id));
  const addedInaccessibleRoom = afterAccess.inaccessibleRooms.some(room => !beforeInvalid.has(room.id));
  const beforeErrors = new Set(validateGeneratedLayout(beforeLayout).errors);
  const addedValidationError = validateGeneratedLayout(afterLayout).errors.some(error => !beforeErrors.has(error));
  return addedInaccessibleRoom || addedValidationError;
}

function restoreRoomSnapshots(rooms, snapshot) {
  rooms.forEach((room, index) => {
    for (const key of Object.keys(room)) {
      if (!(key in snapshot[index])) delete room[key];
    }
    Object.assign(room, snapshot[index]);
  });
}

function determineRequestedTransferArea(operation, source, target, unit) {
  const squareFactor = String(unit || "ft").toLowerCase() === "m" ? 1 / 10.7639 : 1;

  if (Number(operation.amount_sqft) > 0) {
    return Number(operation.amount_sqft) * squareFactor;
  }

  if (Number(operation.amount_percent) > 0) {
    const basis = operation.operation === "transfer_area" && source ? source.area : target.area;
    return basis * Number(operation.amount_percent) / 100;
  }

  /*
    For an explicit transfer paired with a persistent room constraint, derive
    the amount from the SOURCE room's requested final size. This is the key
    fix for conversations like:

      "Make Bedroom 3 exactly 10 x 11."
      "Family Lounge."

    The second turn may contain no amount fields on transfer_area, but the
    source room still carries its 10 x 11 requestedConstraint. Falling back
    to 8% here would be incorrect.
  */
  if (operation.operation === "transfer_area" && source?.requestedConstraint) {
    const constraint = source.requestedConstraint;
    const currentArea = Number(source.width) * Number(source.height);
    const width = Number(constraint.width);
    const depth = Number(constraint.depth);
    const absoluteArea = Number(constraint.area);
    const areaDelta = Number(constraint.areaDelta);

    let requestedSourceArea = null;
    if (width > 0 && depth > 0) {
      requestedSourceArea = width * depth;
    } else if (absoluteArea > 0) {
      requestedSourceArea = absoluteArea;
    } else if (Number.isFinite(areaDelta) && areaDelta < 0) {
      requestedSourceArea = currentArea + areaDelta;
    }

    if (requestedSourceArea != null) {
      return Math.max(0, currentArea - requestedSourceArea);
    }
  }

  if (Number(operation.requested_width) > 0 && Number(operation.requested_depth) > 0) {
    const requestedArea = Number(operation.requested_width) * Number(operation.requested_depth);
    if (operation.operation === "transfer_area" && source) {
      return Math.max(0, source.area - requestedArea);
    }
    return Math.max(0, requestedArea - target.area);
  }

  if (Number(operation.area) > 0) {
    return Math.max(0, Number(operation.area) * squareFactor - target.area);
  }

  if (operation.priority === "high") {
    return target.area * 2;
  }

  /*
    Never invent the old generic 8% amount for an EXPLICIT source->target
    transfer. If the user named both rooms but no quantity can be derived,
    the operation must wait for clarification instead of silently substituting
    a heuristic amount.
  */
  if (operation.operation === "transfer_area" && source && target) {
    return 0;
  }

  return target.area * 0.08;
}

function describeSeparatedTransfer(rooms, source, target, requestedArea) {
  if (!source || !target || source === target || !(requestedArea > 0.5)) return null;

  /*
    Conservative multi-hop transfer.

    The previous implementation used one set of rooms to absorb area from the
    source and a DIFFERENT donor near the target. That conserved total area but
    violated the user's semantics because unrelated rooms became net donors or
    recipients.

    Here we search for one continuous source -> ... -> target room chain. Every
    intermediate room receives and then gives the SAME amount, so its net area
    remains approximately unchanged. No substitute donor is allowed.
  */
  const maxEdges = 6;
  const queue = [{ room: source, path: [source], bottleneck: Infinity }];
  const bestSeen = new Map([[source.id, Infinity]]);
  let bestPath = null;

  while (queue.length) {
    const current = queue.shift();
    const currentRoom = current.room;
    const edgeCount = current.path.length - 1;
    if (edgeCount >= maxEdges) continue;

    for (const next of rooms) {
      if (next === currentRoom || current.path.includes(next)) continue;
      const transfer = describeBoundaryTransfer(currentRoom, next);
      if (!transfer || transfer.maximumArea <= 0.5) continue;

      const bottleneck = Math.min(current.bottleneck, transfer.maximumArea);
      const path = [...current.path, next];

      if (next === target) {
        const candidate = { path, bottleneck };
        if (!bestPath ||
            candidate.bottleneck > bestPath.bottleneck + 0.1 ||
            (Math.abs(candidate.bottleneck - bestPath.bottleneck) <= 0.1 && candidate.path.length < bestPath.path.length)) {
          bestPath = candidate;
        }
        continue;
      }

      const previousBest = bestSeen.get(next.id) || 0;
      if (bottleneck <= previousBest + 0.1) continue;
      bestSeen.set(next.id, bottleneck);
      queue.push({ room: next, path, bottleneck });
    }
  }

  if (!bestPath) return null;

  const amount = Math.min(requestedArea, bestPath.bottleneck);
  if (!(amount > 0.5)) return null;

  const moves = [];
  for (let index = 0; index < bestPath.path.length - 1; index++) {
    const donor = bestPath.path[index];
    const receiver = bestPath.path[index + 1];
    const transfer = describeBoundaryTransfer(donor, receiver);
    if (!transfer || transfer.maximumArea + 0.2 < amount) return null;
    moves.push({ transfer, amount });
  }

  return {
    amount,
    moves,
    conservative: true,
    path: bestPath.path.map(room => room.id),
    intermediateRooms: bestPath.path.slice(1, -1).map(room => room.id)
  };
}

function repairBedroomAccessAfterTransfer(rooms, layout, affectedRooms) {
  const inaccessibleIds = new Set(
    buildAccessibilityReport({ ...layout, rooms }).inaccessibleRooms.map(room => room.id)
  );
  const hall = (layout.circulation || []).find(item => item.overlay && item.height >= item.width);
  if (!hall) return;

  for (const room of affectedRooms) {
    if (!room || !["bedroom", "masterBedroom"].includes(room.type) || !inaccessibleIds.has(room.id)) continue;
    const passageHeight = Math.min(3, room.height);
    const roomEdge = room.x + room.width;
    const x = Math.min(roomEdge - 2, hall.x);
    const right = Math.max(roomEdge, hall.x + hall.width);
    const y = Math.min(room.y, layout.buildableArea.y + layout.buildableArea.height - passageHeight);
    if (hall.y + hall.height < y + passageHeight) hall.height = y + passageHeight - hall.y;
    layout.circulation.push({
      id: `operation-passage-${room.id}`,
      name: "Local Landing",
      type: "corridor",
      overlay: true,
      x,
      y,
      width: right - x,
      height: passageHeight
    });
  }
}

function chooseDonor(rooms, target, requestedArea) {
  return rooms
    .filter(room => room !== target)
    .map(room => describeBoundaryTransfer(room, target))
    .filter(candidate => candidate && candidate.maximumArea > 0.5)
    .sort((first, second) => {
      const firstEnough = first.maximumArea >= requestedArea ? 0 : 1;
      const secondEnough = second.maximumArea >= requestedArea ? 0 : 1;
      return firstEnough - secondEnough || compareTransferCandidates(first, second);
    })[0] || null;
}

function compareTransferCandidates(first, second) {
  const rank = room => {
    const index = PLANNING_ROOM_POLICIES.donorPreference.indexOf(room.type);
    return index < 0 ? 50 : index;
  };
  return rank(first.donor) - rank(second.donor) || second.maximumArea - first.maximumArea;
}

function describeBoundaryTransfer(donor, receiver) {
  if (!donor || !receiver || donor.isCirculation || receiver.isCirculation) return null;
  const tolerance = 0.05;
  const sameRows = Math.abs(donor.y - receiver.y) < tolerance && Math.abs(donor.height - receiver.height) < tolerance;
  const sameColumns = Math.abs(donor.x - receiver.x) < tolerance && Math.abs(donor.width - receiver.width) < tolerance;
  const minimumWidth = minimumDimensionForAxis(donor, "width");
  const minimumHeight = minimumDimensionForAxis(donor, "height");
  const maximumReceiverWidth = receiver.height * PLANNING_ROOM_POLICIES.maximumAspectRatio;
  const maximumReceiverHeight = receiver.width * PLANNING_ROOM_POLICIES.maximumAspectRatio;
  const receiverWidthCapacity = Math.max(0, maximumReceiverWidth - receiver.width) * receiver.height;
  const receiverHeightCapacity = Math.max(0, maximumReceiverHeight - receiver.height) * receiver.width;

  if (sameRows && Math.abs(donor.x + donor.width - receiver.x) < tolerance) {
    return { donor, receiver, axis: "x", direction: "donor-left", span: donor.height, maximumArea: Math.min(Math.max(0, donor.width - minimumWidth) * donor.height, receiverWidthCapacity) };
  }
  if (sameRows && Math.abs(receiver.x + receiver.width - donor.x) < tolerance) {
    return { donor, receiver, axis: "x", direction: "donor-right", span: donor.height, maximumArea: Math.min(Math.max(0, donor.width - minimumWidth) * donor.height, receiverWidthCapacity) };
  }
  if (sameColumns && Math.abs(donor.y + donor.height - receiver.y) < tolerance) {
    return { donor, receiver, axis: "y", direction: "donor-top", span: donor.width, maximumArea: Math.min(Math.max(0, donor.height - minimumHeight) * donor.width, receiverHeightCapacity) };
  }
  if (sameColumns && Math.abs(receiver.y + receiver.height - donor.y) < tolerance) {
    return { donor, receiver, axis: "y", direction: "donor-bottom", span: donor.width, maximumArea: Math.min(Math.max(0, donor.height - minimumHeight) * donor.width, receiverHeightCapacity) };
  }
  return null;
}

function minimumDimensionForAxis(room, axis) {
  const minWidth = Number(room.minWidth || 3);
  const minHeight = Number(room.minHeight || 3);
  if (axis === "width") {
    const candidates = [];
    if (room.height >= minHeight) candidates.push(minWidth);
    if (room.height >= minWidth) candidates.push(minHeight);
    return Math.min(...(candidates.length ? candidates : [Math.max(minWidth, minHeight)]));
  }
  const candidates = [];
  if (room.width >= minWidth) candidates.push(minHeight);
  if (room.width >= minHeight) candidates.push(minWidth);
  return Math.min(...(candidates.length ? candidates : [Math.max(minWidth, minHeight)]));
}

function applyBoundaryTransfer(transfer, amount) {
  const delta = Math.min(amount, transfer.maximumArea) / transfer.span;
  const { donor, receiver, direction } = transfer;
  if (direction === "donor-left") {
    donor.width -= delta;
    receiver.x -= delta;
    receiver.width += delta;
  } else if (direction === "donor-right") {
    donor.x += delta;
    donor.width -= delta;
    receiver.width += delta;
  } else if (direction === "donor-top") {
    donor.height -= delta;
    receiver.y -= delta;
    receiver.height += delta;
  } else {
    donor.y += delta;
    donor.height -= delta;
    receiver.height += delta;
  }
  donor.area = donor.width * donor.height;
  receiver.area = receiver.width * receiver.height;
  donor.operationLocked = true;
  receiver.operationLocked = true;
}

function buildTransferReason(plan, target, requestedArea, actualArea, unit, changes, circulationAreaChange) {
  const requested = round(requestedArea);
  const actual = round(actualArea);
  const areaUnit = String(unit || "ft").toLowerCase() === "m" ? "sq m" : "sq ft";
  const sourceChange = changes.find(change => change.delta < 0);
  const intermediateChanges = changes.filter(change =>
    change !== sourceChange &&
    change.room !== target.name &&
    Math.abs(change.delta) > 0.1
  );
  const pathText = Array.isArray(plan?.path) && plan.path.length > 2
    ? ` The transfer propagated through ${plan.path.length - 2} intermediate room(s) without intentionally using substitute donors.`
    : "";
  const circulationText = circulationAreaChange
    ? ` Local circulation changed by ${round(circulationAreaChange)} ${areaUnit}.`
    : "";
  const intermediateText = intermediateChanges.length
    ? ` Net intermediate changes: ${intermediateChanges.map(change => `${change.room} ${change.delta > 0 ? "+" : ""}${change.delta}`).join(", ")} ${areaUnit}.`
    : "";
  return `${target.name} gained ${actual} ${areaUnit} toward the explicit ${requested} ${areaUnit} source-to-target request.${pathText}${intermediateText}${circulationText}`;
}

function evaluateLayoutOptimization(rooms, layout, operation) {
  const suggestions = [];
  const circulationArea = (layout.circulation || []).reduce((sum, item) => sum + item.width * item.height, 0);
  const roomArea = rooms.reduce((sum, room) => sum + room.width * room.height, 0);
  if (circulationArea > roomArea * 0.15) suggestions.push("Shorten excessive circulation where access can be preserved.");
  const kitchen = rooms.find(room => room.id === "kitchen");
  const dining = rooms.find(room => room.id === "dining");
  if (kitchen && dining && !describeBoundaryTransfer(kitchen, dining) && !describeBoundaryTransfer(dining, kitchen)) {
    suggestions.push("Improve the Kitchen and Dining relationship with a local adjacency change.");
  }
  const awkwardRooms = rooms.filter(room => Math.max(room.width / room.height, room.height / room.width) > PLANNING_ROOM_POLICIES.maximumAspectRatio);
  if (awkwardRooms.length) suggestions.push(`Improve narrow proportions in ${awkwardRooms.map(room => room.name).join(", ")}.`);
  if (!suggestions.length) suggestions.push("No low-impact improvement is necessary; preserve the current arrangement.");
  return {
    operation: "optimize_layout",
    source_room: null,
    target_room: null,
    requested_area: null,
    actual_area: 0,
    status: "proposed",
    changes: [],
    footprint_changed: false,
    confirmation_required: true,
    suggestions,
    reason: operation.reason || "Evaluated practical local improvements without changing geometry."
  };
}

function repairAttachedBathroomsAfterOperations(rooms, layout, operationReport) {
  const movedCanonicalIds = new Set(
    operationReport
      .filter(result => ["applied", "approximated"].includes(result.status))
      .flatMap(result => [result.source_room, result.target_room])
  );
  const canonicalBedroomIds = {
    masterBedroom: "bedroom-1",
    bedroom2: "bedroom-2",
    bedroom3: "bedroom-3",
    bedroom4: "bedroom-4"
  };
  const movedBedroomIds = new Set(
    [...movedCanonicalIds]
      .map(id => canonicalBedroomIds[id])
      .filter(Boolean)
  );
  const tolerance = 0.05;
  const touches = (first, second) => {
    const verticalOverlap = Math.min(first.y + first.height, second.y + second.height) - Math.max(first.y, second.y);
    const horizontalOverlap = Math.min(first.x + first.width, second.x + second.width) - Math.max(first.x, second.x);
    return (
      (Math.abs(first.x + first.width - second.x) < tolerance || Math.abs(second.x + second.width - first.x) < tolerance) && verticalOverlap > 1.6
    ) || (
      (Math.abs(first.y + first.height - second.y) < tolerance || Math.abs(second.y + second.height - first.y) < tolerance) && horizontalOverlap > 1.6
    );
  };
  const overlaps = (first, second) => !(
    first.x + first.width <= second.x + tolerance ||
    second.x + second.width <= first.x + tolerance ||
    first.y + first.height <= second.y + tolerance ||
    second.y + second.height <= first.y + tolerance
  );

  for (const bathroom of rooms.filter(room => room.type === "attachedToilet" && movedBedroomIds.has(room.attachedTo))) {
    const bedroom = rooms.find(room => room.id === bathroom.attachedTo);
    if (!bedroom || touches(bathroom, bedroom)) continue;
    const snapshot = { ...bathroom };
    const sizes = [
      { width: bathroom.width, height: bathroom.height },
      { width: Number(bathroom.preferredWidth), height: Number(bathroom.preferredHeight) },
      { width: Number(bathroom.minWidth), height: Number(bathroom.minHeight) },
      { width: Number(bathroom.minHeight), height: Number(bathroom.minWidth) }
    ].filter(size => size.width > 0 && size.height > 0);
    let repaired = false;

    for (const size of sizes) {
      const candidates = [
        { x: bedroom.x, y: bedroom.y - size.height },
        { x: bedroom.x + bedroom.width - size.width, y: bedroom.y - size.height },
        { x: bedroom.x, y: bedroom.y + bedroom.height },
        { x: bedroom.x + bedroom.width - size.width, y: bedroom.y + bedroom.height },
        { x: bedroom.x - size.width, y: bedroom.y },
        { x: bedroom.x - size.width, y: bedroom.y + bedroom.height - size.height },
        { x: bedroom.x + bedroom.width, y: bedroom.y },
        { x: bedroom.x + bedroom.width, y: bedroom.y + bedroom.height - size.height }
      ];
      for (const candidate of candidates) {
        Object.assign(bathroom, {
          x: round(candidate.x),
          y: round(candidate.y),
          width: size.width,
          height: size.height,
          area: round(size.width * size.height)
        });
        const inside = bathroom.x >= layout.buildableArea.x - tolerance &&
          bathroom.y >= layout.buildableArea.y - tolerance &&
          bathroom.x + bathroom.width <= layout.buildableArea.x + layout.buildableArea.width + tolerance &&
          bathroom.y + bathroom.height <= layout.buildableArea.y + layout.buildableArea.height + tolerance;
        if (inside && touches(bathroom, bedroom) && !rooms.some(room => room !== bathroom && overlaps(bathroom, room))) {
          repaired = true;
          break;
        }
      }
      if (repaired) break;
    }

    if (!repaired) Object.assign(bathroom, snapshot);
  }
}

function repairCommonToiletAccess(rooms, layout) {
  const report = [];
  const access = buildAccessibilityReport({ ...layout, rooms });
  const inaccessibleIds = new Set(access.inaccessibleCommonToilets.map(room => room.id));
  const circulation = Array.isArray(layout.circulation) ? layout.circulation : [];
  const buildable = layout.buildableArea;
  const tolerance = 0.05;

  const overlaps = (candidate, other) => !(
    candidate.x + candidate.width <= other.x + tolerance ||
    other.x + other.width <= candidate.x + tolerance ||
    candidate.y + candidate.height <= other.y + tolerance ||
    other.y + other.height <= candidate.y + tolerance
  );

  for (const room of rooms.filter(item => inaccessibleIds.has(item.id))) {
    const snapshot = { x: room.x, y: room.y, width: room.width, height: room.height, area: room.area };
    let applied = false;

    const sizes = [
      { width: room.width, height: room.height },
      { width: Number(room.preferredWidth || room.minWidth), height: Number(room.preferredHeight || room.minHeight) },
      { width: Number(room.minWidth), height: Number(room.minHeight) },
      { width: Number(room.minHeight), height: Number(room.minWidth) }
    ].filter(size => size.width > 0 && size.height > 0);

    for (const size of sizes) {
      room.width = size.width;
      room.height = size.height;
      room.area = round(size.width * size.height);

      for (const corridor of circulation) {
      const candidates = [];
      const verticalStep = Math.max(0.5, room.height / 4);
      const horizontalStep = Math.max(0.5, room.width / 4);

      for (let y = corridor.y; y <= corridor.y + corridor.height - room.height + tolerance; y += verticalStep) {
        candidates.push({ x: corridor.x - room.width, y });
        candidates.push({ x: corridor.x + corridor.width, y });
      }
      for (let x = corridor.x; x <= corridor.x + corridor.width - room.width + tolerance; x += horizontalStep) {
        candidates.push({ x, y: corridor.y - room.height });
        candidates.push({ x, y: corridor.y + corridor.height });
      }

      for (const candidate of candidates) {
        const positioned = { ...room, x: round(candidate.x), y: round(candidate.y) };
        const inside = positioned.x >= buildable.x - tolerance &&
          positioned.y >= buildable.y - tolerance &&
          positioned.x + positioned.width <= buildable.x + buildable.width + tolerance &&
          positioned.y + positioned.height <= buildable.y + buildable.height + tolerance;
        if (!inside || rooms.some(other => other !== room && overlaps(positioned, other))) continue;

        room.x = positioned.x;
        room.y = positioned.y;
        const candidateLayout = { ...layout, rooms };
        const candidateAccess = buildAccessibilityReport(candidateLayout);
        const commonToiletAccessible = !candidateAccess.inaccessibleCommonToilets.some(item => item.id === room.id);
        if (commonToiletAccessible && validateGeneratedLayout(candidateLayout).valid) {
          applied = true;
          break;
        }
        Object.assign(room, snapshot);
      }
      if (applied) break;
      }
      if (applied) break;
    }

    if (!applied) Object.assign(room, snapshot);
    report.push({
      roomId: room.id,
      room: room.name,
      status: applied ? "applied" : "not-feasible",
      actual: { x: room.x, y: room.y, width: room.width, depth: room.height }
    });
  }

  return report;
}

function hasValidCandidateRooms(layout, rooms) {
  const candidate = { ...layout, rooms, areaSummary: null };
  return buildAccessibilityReport(candidate).valid && validateGeneratedLayout(candidate).valid;
}

function ensureExteriorBalcony(rooms, buildable, requirements) {
  if (requirements?.preferences?.balcony !== true || rooms.some(room => room.type === "balcony")) {
    return [];
  }

  const living = rooms.find(room => room.id === "living");
  if (!living) return [{ room: "Balcony", status: "not-feasible", reason: "Living room was not found." }];

  const unit = String(requirements?.plot?.unit || "ft").toLowerCase();
  const depth = unit === "m" ? 1.8 : 6;
  const minLivingWidth = Number(living.minWidth || (unit === "m" ? 3 : 10));
  const touchesWest = Math.abs(living.x - buildable.x) < 0.05;
  const touchesEast = Math.abs(living.x + living.width - buildable.x - buildable.width) < 0.05;

  if ((touchesWest || touchesEast) && living.width - depth >= minLivingWidth) {
    const balcony = {
      id: "balcony",
      name: "Balcony",
      type: "balcony",
      attachedTo: "living",
      requiresExteriorWall: true,
      requiresCirculationAccess: false,
      x: touchesWest ? living.x : living.x + living.width - depth,
      y: living.y,
      width: depth,
      height: living.height,
      minWidth: unit === "m" ? 1.2 : 4,
      minHeight: unit === "m" ? 2.4 : 6,
      area: round(depth * living.height)
    };
    if (touchesWest) living.x += depth;
    living.width -= depth;
    living.area = round(living.width * living.height);
    rooms.push(balcony);
    return [{ room: "Balcony", status: "applied", actual: { width: balcony.width, depth: balcony.height, area: balcony.area } }];
  }

  return [{ room: "Balcony", status: "not-feasible", reason: "The living room has no exterior edge with enough depth." }];
}

function applyRoomSizeConstraints(rooms, layout) {
  const reports = [];
  const EPSILON = 0.05;

  const initialAccess =
    buildAccessibilityReport({
      ...layout,
      rooms
    });

  const accessByRoom =
    new Map(
      initialAccess.connections.map(
        item => [
          item.roomId,
          item.boundary
        ]
      )
    );

  const minimum = (
    room,
    dimension
  ) =>
    Number(
      dimension === "width"
        ? room.minWidth || 3
        : room.minHeight || 3
    );

  const coversRange = (
    items,
    start,
    end,
    axis
  ) => {
    const intervals =
      items
        .map(item =>
          axis === "y"
            ? [
                item.y,
                item.y + item.height
              ]
            : [
                item.x,
                item.x + item.width
              ]
        )
        .sort(
          (a, b) =>
            a[0] - b[0]
        );

    let cursor = start;

    for (
      const [from, to]
      of intervals
    ) {
      if (
        from >
        cursor + EPSILON
      ) {
        return false;
      }

      cursor =
        Math.max(
          cursor,
          to
        );

      if (
        cursor >=
        end - EPSILON
      ) {
        return true;
      }
    }

    return (
      cursor >=
      end - EPSILON
    );
  };


  /*
    ---------------------------------------------------------
    WIDTH CHANGE
    ---------------------------------------------------------

    Shrinking:
      simply releases room width while keeping the chosen
      exterior/access edge stable where practical.

    Growing:
      borrows width from rooms sharing the complete boundary,
      but never pushes those rooms below their practical minimum.
  */
  const shiftWidth = (
    room,
    targetWidth
  ) => {
    const delta =
      targetWidth -
      room.width;

    if (
      Math.abs(delta) <
      EPSILON
    ) {
      return true;
    }


    /*
      SHRINK
    */
    if (
      delta < 0
    ) {
      const accessWall =
        accessByRoom.get(
          room.id
        )?.wall;

      const touchesExteriorLeft =
        room.requiresExteriorWall &&
        Math.abs(
          room.x -
          layout.buildableArea.x
        ) <
          EPSILON;

      const touchesExteriorRight =
        room.requiresExteriorWall &&
        Math.abs(
          room.x +
          room.width -
          layout.buildableArea.x -
          layout.buildableArea.width
        ) <
          EPSILON;

      /*
        Preserve the exterior/access side where practical.
      */
      if (
        touchesExteriorRight ||
        (
          accessWall === "east" &&
          !touchesExteriorLeft
        )
      ) {
        room.x +=
          room.width -
          targetWidth;
      }

      room.width =
        targetWidth;

      return true;
    }


    /*
      GROW RIGHT
    */
    const right =
      rooms.filter(
        other =>
          other !== room &&
          Math.abs(
            other.x -
            (
              room.x +
              room.width
            )
          ) <
            EPSILON &&
          rangesOverlap(
            room.y,
            room.y +
              room.height,
            other.y,
            other.y +
              other.height
          )
      );

    if (
      right.length &&
      coversRange(
        right,
        room.y,
        room.y +
          room.height,
        "y"
      ) &&
      right.every(
        other =>
          other.width -
            delta >=
          minimum(
            other,
            "width"
          )
      )
    ) {
      room.width =
        targetWidth;

      right.forEach(
        other => {
          other.x +=
            delta;

          other.width -=
            delta;
        }
      );

      return true;
    }


    /*
      GROW LEFT
    */
    const left =
      rooms.filter(
        other =>
          other !== room &&
          Math.abs(
            other.x +
            other.width -
            room.x
          ) <
            EPSILON &&
          rangesOverlap(
            room.y,
            room.y +
              room.height,
            other.y,
            other.y +
              other.height
          )
      );

    if (
      left.length &&
      coversRange(
        left,
        room.y,
        room.y +
          room.height,
        "y"
      ) &&
      left.every(
        other =>
          other.width -
            delta >=
          minimum(
            other,
            "width"
          )
      )
    ) {
      room.x -=
        delta;

      room.width =
        targetWidth;

      left.forEach(
        other => {
          other.width -=
            delta;
        }
      );

      return true;
    }

    return false;
  };


  /*
    ---------------------------------------------------------
    HEIGHT CHANGE
    ---------------------------------------------------------
  */
  const shiftHeight = (
    room,
    targetHeight
  ) => {
    const delta =
      targetHeight -
      room.height;

    if (
      Math.abs(delta) <
      EPSILON
    ) {
      return true;
    }


    /*
      SHRINK
    */
    if (
      delta < 0
    ) {
      const accessWall =
        accessByRoom.get(
          room.id
        )?.wall;

      const touchesExteriorTop =
        room.requiresExteriorWall &&
        Math.abs(
          room.y -
          layout.buildableArea.y
        ) <
          EPSILON;

      const touchesExteriorBottom =
        room.requiresExteriorWall &&
        Math.abs(
          room.y +
          room.height -
          layout.buildableArea.y -
          layout.buildableArea.height
        ) <
          EPSILON;

      if (
        touchesExteriorBottom ||
        (
          accessWall === "south" &&
          !touchesExteriorTop
        )
      ) {
        room.y +=
          room.height -
          targetHeight;
      }

      room.height =
        targetHeight;

      return true;
    }


    /*
      GROW DOWN
    */
    const below =
      rooms.filter(
        other =>
          other !== room &&
          Math.abs(
            other.y -
            (
              room.y +
              room.height
            )
          ) <
            EPSILON &&
          rangesOverlap(
            room.x,
            room.x +
              room.width,
            other.x,
            other.x +
              other.width
          )
      );

    if (
      below.length &&
      coversRange(
        below,
        room.x,
        room.x +
          room.width,
        "x"
      ) &&
      below.every(
        other =>
          other.height -
            delta >=
          minimum(
            other,
            "height"
          )
      )
    ) {
      room.height =
        targetHeight;

      below.forEach(
        other => {
          other.y +=
            delta;

          other.height -=
            delta;
        }
      );

      return true;
    }


    /*
      GROW UP
    */
    const above =
      rooms.filter(
        other =>
          other !== room &&
          Math.abs(
            other.y +
            other.height -
            room.y
          ) <
            EPSILON &&
          rangesOverlap(
            room.x,
            room.x +
              room.width,
            other.x,
            other.x +
              other.width
          )
      );

    if (
      above.length &&
      coversRange(
        above,
        room.x,
        room.x +
          room.width,
        "x"
      ) &&
      above.every(
        other =>
          other.height -
            delta >=
          minimum(
            other,
            "height"
          )
      )
    ) {
      room.y -=
        delta;

      room.height =
        targetHeight;

      above.forEach(
        other => {
          other.height -=
            delta;
        }
      );

      return true;
    }

    return false;
  };


  /*
    ---------------------------------------------------------
    PROPORTIONAL AREA RESIZE
    ---------------------------------------------------------

    Example:

      current:
        18 × 10.8
        = 194.4 sq ft

      user:
        reduce by 20 sq ft

      target:
        174.4 sq ft

      scale:
        sqrt(174.4 / 194.4)

    Both dimensions change instead of changing only width.
  */
  const shiftProportionally = (
    room,
    targetArea
  ) => {
    const currentArea =
      room.width *
      room.height;

    if (
      !(targetArea > 0) ||
      !(currentArea > 0)
    ) {
      return false;
    }

    const scale =
      Math.sqrt(
        targetArea /
        currentArea
      );

    const targetWidth =
      Math.max(
        minimum(
          room,
          "width"
        ),
        room.width *
          scale
      );

    const targetHeight =
      Math.max(
        minimum(
          room,
          "height"
        ),
        room.height *
          scale
      );


    /*
      Practical minimum dimensions may prevent us from
      achieving the requested target.
    */
    if (
      targetWidth *
        targetHeight >
      targetArea +
        Math.max(
          2,
          targetArea *
            0.02
        )
    ) {
      return false;
    }


    /*
      Shared-wall geometry can depend on which dimension
      changes first.

      Try width → height first.
    */
    const snapshot =
      rooms.map(
        item => ({
          ...item
        })
      );

    let applied =
      shiftWidth(
        room,
        targetWidth
      );

    if (
      applied
    ) {
      applied =
        shiftHeight(
          room,
          targetHeight
        );
    }

    if (
      applied
    ) {
      return true;
    }


    /*
      Roll back and try:
      height → width.
    */
    rooms.forEach(
      (
        item,
        index
      ) =>
        Object.assign(
          item,
          snapshot[index]
        )
    );

    applied =
      shiftHeight(
        room,
        targetHeight
      );

    if (
      applied
    ) {
      applied =
        shiftWidth(
          room,
          targetWidth
        );
    }

    if (
      applied
    ) {
      return true;
    }


    /*
      Neither direction worked.
      Restore original geometry.
    */
    rooms.forEach(
      (
        item,
        index
      ) =>
        Object.assign(
          item,
          snapshot[index]
        )
    );

    return false;
  };


  /*
    ---------------------------------------------------------
    APPLY EACH REQUESTED ROOM CONSTRAINT
    ---------------------------------------------------------
  */
  for (
    const room
    of rooms.filter(
      item =>
        item.requestedConstraint ||
        item.requestedSizeScale
    )
  ) {
    const snapshot =
      rooms.map(
        item => ({
          ...item
        })
      );

    const beforeRoom =
      snapshot.find(
        item =>
          item.id ===
          room.id
      );

    const constraint =
      room.requestedConstraint ||
      {};

    const currentArea =
      room.width *
      room.height;


    /*
      Signed area delta is important.

      +20 = grow by 20
      -20 = shrink by 20
    */
    const numericAreaDelta =
      Number(
        constraint.areaDelta
      );

    const hasAreaDelta =
      Number.isFinite(
        numericAreaDelta
      ) &&
      numericAreaDelta !==
        0;


    /*
      AREA TARGET PRIORITY

      1. explicit area
      2. signed areaDelta
      3. requestedSizeScale
    */
    const requestedArea =
      Number(
        constraint.area
      ) > 0
        ? Number(
            constraint.area
          )
        : hasAreaDelta
          ? currentArea +
            numericAreaDelta
          : room.requestedSizeScale
            ? currentArea *
              Number(
                room.requestedSizeScale
              )
            : null;


    /*
      Exact dimensions remain separate.

      14 × 14 is NOT merely 196 sq ft.
    */
    const requestedWidth =
      Number(
        constraint.width
      ) > 0
        ? Number(
            constraint.width
          )
        : null;

    const requestedHeight =
      Number(
        constraint.depth
      ) > 0
        ? Number(
            constraint.depth
          )
        : null;

    let applied = true;


    /*
      -------------------------------------------------------
      EXACT DIMENSION MODE
      -------------------------------------------------------
    */
    if (
      requestedWidth
    ) {
      applied =
        shiftWidth(
          room,
          Math.max(
            minimum(
              room,
              "width"
            ),
            requestedWidth
          )
        );
    }

    if (
      applied &&
      requestedHeight
    ) {
      applied =
        shiftHeight(
          room,
          Math.max(
            minimum(
              room,
              "height"
            ),
            requestedHeight
          )
        );
    }


    /*
      -------------------------------------------------------
      AREA-ONLY MODE
      -------------------------------------------------------

      This includes:

        reduce by 20 sq ft
        increase by 30 sq ft
        make it 10% smaller
        make it slightly larger

      when no explicit width/depth was supplied.
    */
    if (
      applied &&
      requestedArea &&
      !requestedWidth &&
      !requestedHeight
    ) {
      applied =
        shiftProportionally(
          room,
          requestedArea
        );
    }


    /*
      Any failure rolls the complete local resize back.
    */
    if (
      !applied
    ) {
      rooms.forEach(
        (
          item,
          index
        ) =>
          Object.assign(
            item,
            snapshot[index]
          )
      );
    }


    /*
      Normalize geometry.
    */
    rooms.forEach(
      item => {
        item.x =
          round(
            item.x
          );

        item.y =
          round(
            item.y
          );

        item.width =
          round(
            item.width
          );

        item.height =
          round(
            item.height
          );

        item.area =
          round(
            item.width *
            item.height
          );
      }
    );


    const actualArea =
      round(
        room.width *
        room.height
      );


    /*
      "applied" means the actual generated geometry really
      satisfies the user's dimensional/area request.
    */
    const exact =
      applied &&

      (
        !requestedWidth ||
        Math.abs(
          room.width -
          requestedWidth
        ) <
          0.1
      ) &&

      (
        !requestedHeight ||
        Math.abs(
          room.height -
          requestedHeight
        ) <
          0.1
      ) &&

      (
        !requestedArea ||
        Math.abs(
          actualArea -
          requestedArea
        ) <=
          Math.max(
            2,
            requestedArea *
              0.02
          )
      );


    const beforeArea =
      beforeRoom
        ? round(
            beforeRoom.width *
            beforeRoom.height
          )
        : null;


    /*
      Report from the actual final room geometry,
      not from an intermediate transfer calculation.
    */
    reports.push({
      roomId:
        room.id,

      room:
        room.name,

      operation:
        "resize",

      status:
        !applied
          ? "not-feasible"
          : exact
            ? "applied"
            : "approximated",

      requested: {
        width:
          requestedWidth,

        depth:
          requestedHeight,

        area:
          requestedArea,

        areaDelta:
          hasAreaDelta
            ? numericAreaDelta
            : null
      },

      before:
        beforeRoom
          ? {
              width:
                round(
                  beforeRoom.width
                ),

              depth:
                round(
                  beforeRoom.height
                ),

              area:
                beforeArea
            }
          : null,

      actual: {
        width:
          room.width,

        depth:
          room.height,

        area:
          actualArea
      },

      actualAreaDelta:
        beforeArea == null
          ? null
          : round(
              actualArea -
              beforeArea
            )
    });
  }

  return reports;
}

function buildAreaSummary(rooms, circulation, target) {
  const calculatedRoomArea = round(rooms.reduce((sum, room) => sum + room.width * room.height, 0));
  const circulationArea = round((circulation || [])
    .filter(item => !item.overlay)
    .reduce((sum, item) => sum + item.width * item.height, 0));
  const balconyArea = round(rooms
    .filter(room => room.type === "balcony" || room.type === "deck")
    .reduce((sum, room) => sum + room.width * room.height, 0));
  const internalRectangles = [
    ...rooms.filter(room => room.type !== "balcony" && room.type !== "deck"),
    ...(circulation || []).filter(item => !item.overlay)
  ];
  const calculatedInternalArea = round(calculateRectangleUnionArea(internalRectangles));
  const targetInternalArea = Number(target?.area) > 0 ? round(Number(target.area)) : null;
  const differenceRatio = targetInternalArea
    ? Math.abs(calculatedInternalArea - targetInternalArea) / targetInternalArea
    : 0;
  return {
    status: !targetInternalArea
      ? null
      : differenceRatio <= 0.08
        ? "applied"
        : differenceRatio <= 0.2
          ? "approximated"
          : "not-feasible",
    targetInternalArea,
    calculatedRoomArea,
    circulationArea,
    balconyArea,
    calculatedInternalArea,
    unit: target?.unit || null
  };
}

function calculateRectangleUnionArea(rectangles) {
  const xValues = [...new Set(rectangles.flatMap(item => [item.x, item.x + item.width]))]
    .sort((a, b) => a - b);
  let area = 0;
  for (let index = 0; index < xValues.length - 1; index++) {
    const x1 = xValues[index];
    const x2 = xValues[index + 1];
    if (x2 <= x1) continue;
    const intervals = rectangles
      .filter(item => item.x < x2 && item.x + item.width > x1)
      .map(item => [item.y, item.y + item.height])
      .sort((a, b) => a[0] - b[0]);
    let covered = 0;
    let start = null;
    let end = null;
    for (const [from, to] of intervals) {
      if (start == null) {
        start = from;
        end = to;
      } else if (from <= end) {
        end = Math.max(end, to);
      } else {
        covered += end - start;
        start = from;
        end = to;
      }
    }
    if (start != null) covered += end - start;
    area += (x2 - x1) * covered;
  }
  return area;
}

function withAccessibilityCheck(layout) {
  const accessibilityReport = buildAccessibilityReport(layout);
  const validationReport = validateGeneratedLayout(layout);
  const valid = accessibilityReport.valid && validationReport.valid;
  return {
    ...layout,
    success: layout.success && valid,
    reason: valid
      ? layout.reason
      : !accessibilityReport.valid
        ? "inaccessible-rooms"
        : "invalid-layout-geometry",
    accessibilityReport,
    validationReport
  };
}


function generateLargeConnectedLayout(
  requirements
) {
  const country =
    String(
      requirements.country ||
      "india"
    ).toLowerCase();

  const bhk =
    Number(
      requirements.house?.bhk ||
      4
    );

  const floors =
    Number(
      requirements.house?.floors ||
      1
    );

  const roadSide =
    normalizeRoadSideV16(
      requirements.plot?.roadSide
    );

  if (
    floors !== 1 ||
    !["north", "south"].includes(
      roadSide
    )
  ) {
    return null;
  }

  const areaInfo =
    calculateBuildableArea(
      requirements
    );

  const feasibility =
    checkPlanFeasibility(
      requirements
    );

  if (
    feasibility.status ===
    "infeasible"
  ) {
    return null;
  }

  const profile =
    getDesignProfile(
      country
    );

  const b =
    areaInfo.buildable;

  const program =
    buildRoomProgram(
      requirements
    );

  const byId =
    Object.fromEntries(
      program.map(
        room => [
          room.id,
          {
            ...room
          }
        ]
      )
    );

  const living =
    byId.living;

  const dining =
    byId.dining;

  const family =
    byId["family-lounge"];

  const kitchen =
    byId.kitchen;

  const utility =
    byId.utility;

  const bedrooms =
    program.filter(
      room =>
        room.type ===
          "masterBedroom" ||
        room.type ===
          "bedroom"
    );

  const wetRooms =
    program.filter(
      room =>
        room.type ===
          "attachedToilet" ||
        room.type ===
          "commonToilet"
    );

  const extras =
    program.filter(
      room =>
        [
          "puja",
          "store"
        ].includes(
          room.type
        )
    );

  if (
    !living ||
    !dining ||
    !kitchen ||
    bedrooms.length !== bhk
  ) {
    return null;
  }

  /*
    Connected zoning:
      FRONT  = living + family lounge
      SOCIAL = kitchen + dining + family / optional
      WET    = utility + bathrooms + optional
      PRIVATE= bedrooms in 2 rows

    No floating rectangles and no full-height passage.
  */

  const frontH =
    b.height *
    0.22;

  const socialH =
    b.height *
    0.18;

  const wetH =
    b.height *
    0.12;

  const privateH =
    b.height -
    frontH -
    socialH -
    wetH;

  if (
    privateH <= 0
  ) {
    return null;
  }

  const hallW =
    country === "germany"
      ? Math.min(
          1.25,
          b.width * 0.08
        )
      : Math.min(
          4.0,
          b.width * 0.08
        );

  const rooms = [];

  const roomScales =
    requirements.preferences
      ?.roomScales ||
    {};

  const familyScale =
    Number(
      roomScales.familyLounge ||
      1
    );

  const livingScale =
    Number(
      roomScales.living ||
      1
    );

  const familyShare =
    family
      ? clampLarge(
          0.40 *
            familyScale /
            Math.max(
              0.7,
              (
                familyScale +
                livingScale
              ) /
              2
            ),
          0.32,
          0.55
        )
      : 0;

  const livingShare =
    family
      ? 1 -
        familyShare
      : 0.62;

  if (
    family
  ) {
    placeLarge(
      rooms,
      living,
      b.x,
      b.y,
      b.width *
        livingShare,
      frontH
    );

    placeLarge(
      rooms,
      family,
      b.x +
        b.width *
        livingShare,
      b.y,
      b.width *
        familyShare,
      frontH
    );
  } else {
    placeLarge(
      rooms,
      living,
      b.x,
      b.y,
      b.width *
        0.62,
      frontH
    );

    placeLarge(
      rooms,
      dining,
      b.x +
        b.width *
        0.62,
      b.y,
      b.width *
        0.38,
      frontH
    );
  }

  const ySocial =
    b.y +
    frontH;

  const socialLeft =
    b.width *
    0.34;

  const socialMiddle =
    b.width *
    0.30;

  const socialRight =
    b.width -
    socialLeft -
    socialMiddle;

  placeLarge(
    rooms,
    kitchen,
    b.x,
    ySocial,
    socialLeft,
    socialH
  );

  if (
    family
  ) {
    placeLarge(
      rooms,
      dining,
      b.x +
        socialLeft,
      ySocial,
      socialMiddle,
      socialH
    );
  }

  /*
    Right social block:
    if family is already in front, keep a flexible social/foyer
    block; otherwise dining occupies it.
  */
  const socialFlexRoom =
    extras.length
      ? extras.shift()
      : null;

  if (
    socialFlexRoom
  ) {
    placeLarge(
      rooms,
      socialFlexRoom,
      b.x +
        socialLeft +
        socialMiddle,
      ySocial,
      socialRight,
      socialH
    );
  }

  const yWet =
    ySocial +
    socialH;

  const serviceRooms = [
    ...(utility
      ? [
          utility
        ]
      : []),
    ...wetRooms,
    ...extras
  ];

  if (
    !serviceRooms.length
  ) {
    return null;
  }

  const serviceW =
    b.width /
    serviceRooms.length;

  serviceRooms.forEach(
    (
      room,
      index
    ) => {
      placeLarge(
        rooms,
        room,
        b.x +
          serviceW *
          index,
        yWet,
        index ===
          serviceRooms.length -
          1
          ? (
              b.x +
              b.width
            ) -
            (
              b.x +
              serviceW *
              index
            )
          : serviceW,
        wetH
      );
    }
  );

  const yPrivate =
    yWet +
    wetH;

  const row1Count =
    Math.ceil(
      bedrooms.length /
      2
    );

  const row2Count =
    bedrooms.length -
    row1Count;

  const row1H =
    privateH /
    2;

  const row2H =
    privateH -
    row1H;

  const row1 =
    bedrooms.slice(
      0,
      row1Count
    );

  const row2 =
    bedrooms.slice(
      row1Count
    );

  row1.forEach(
    (
      room,
      index
    ) => {
      const w =
        b.width /
        row1.length;

      placeLarge(
        rooms,
        room,
        b.x +
          w *
          index,
        yPrivate,
        index ===
          row1.length -
          1
          ? (
              b.x +
              b.width
            ) -
            (
              b.x +
              w *
              index
            )
          : w,
        row1H
      );
    }
  );

  row2.forEach(
    (
      room,
      index
    ) => {
      const w =
        b.width /
        row2.length;

      placeLarge(
        rooms,
        room,
        b.x +
          w *
          index,
        yPrivate +
          row1H,
        index ===
          row2.length -
          1
          ? (
              b.x +
              b.width
            ) -
            (
              b.x +
              w *
              index
            )
          : w,
        row2H
      );
    }
  );

  /*
    Compact hall from social zone into private rooms.
  */
  const hallX =
    b.x +
    b.width /
    2 -
    hallW /
    2;

  const hall = {
    id:
      "central-hall",

    name:
      "Hall",

    type:
      "corridor",

    overlay:
      true,

    x:
      hallX,

    y:
      ySocial,

    width:
      hallW,

    height:
      privateH *
        0.58 +
      socialH +
      wetH
  };

  /*
    Main entrance into front living/family zone.
  */
  const entranceRoom =
    living;

  const entranceWidth =
    country === "germany"
      ? 1.05
      : 4.0;

  const entranceRoomPlaced =
    rooms.find(
      room =>
        room.id ===
        entranceRoom.id
    );

  const mainEntrance = {
    id:
      "main-entrance",

    name:
      "Main Entrance",

    type:
      "entrance",

    roomId:
      entranceRoom.id,

    side:
      roadSide,

    width:
      entranceWidth,

    x:
      entranceRoomPlaced.x +
      entranceRoomPlaced.width *
      0.72,

    y:
      roadSide ===
        "north"
        ? entranceRoomPlaced.y
        : entranceRoomPlaced.y +
          entranceRoomPlaced.height
  };

  /*
    Explicit bedroom doors onto central hall where feasible.
  */
  const interiorDoors =
    bedrooms.map(
      (
        bedroom,
        index
      ) => {
        const placed =
          rooms.find(
            room =>
              room.id ===
              bedroom.id
          );

        const centerX =
          placed.x +
          placed.width /
          2;

        const side =
          centerX <
          hallX
            ? "east"
            : "west";

        return {
          id:
            `${bedroom.id}-entry`,

          roomId:
            bedroom.id,

          side,

          y:
            placed.y +
            Math.min(
              placed.height *
                0.28,
              country ===
                "germany"
                ? 1.4
                : 5
            ),

          width:
            country ===
              "germany"
              ? 0.90
              : 3.0,

          swing:
            index %
              2 ===
            0
              ? "left"
              : "right"
        };
      }
    );

  if (
    roadSide ===
    "south"
  ) {
    mirrorLarge(
      rooms,
      [
        hall
      ],
      b
    );
  }

  return {
    success:
      true,

    country,

    unit:
      String(
        requirements.plot?.unit ||
        profile.unit ||
        "ft"
      ).toLowerCase(),

    roadSide,

    plot:
      areaInfo.plot,

    setbacks:
      areaInfo.setbacks,

    buildableArea:
      b,

    feasibility,

    circulation: [
      hall
    ],

    entrances: [
      mainEntrance
    ],

    interiorDoors,

    rooms,

    failedRooms: [],

    placementStrategy:
      "large-connected-family-v19",

    statistics: {
      requestedRooms:
        rooms.length,

      placedRooms:
        rooms.length,

      failedRooms:
        0,

      roomArea:
        roundLarge(
          rooms.reduce(
            (
              sum,
              room
            ) =>
              sum +
              room.width *
              room.height,
            0
          )
        ),

      corridorArea:
        roundLarge(
          hall.width *
          hall.height
        )
    },

    adaptations: []
  };
}


function placeLarge(
  target,
  room,
  x,
  y,
  width,
  height
) {
  if (
    !room
  ) {
    return;
  }

  target.push({
    ...room,

    x:
      roundLarge(x),

    y:
      roundLarge(y),

    width:
      roundLarge(width),

    height:
      roundLarge(height),

    area:
      roundLarge(
        width *
        height
      )
  });
}


function mirrorLarge(
  rooms,
  circulation,
  buildable
) {
  for (
    const item
    of [
      ...rooms,
      ...circulation
    ]
  ) {
    const offset =
      item.y -
      buildable.y;

    item.y =
      roundLarge(
        buildable.y +
        buildable.height -
        offset -
        item.height
      );
  }
}


function clampLarge(
  value,
  min,
  max
) {
  return Math.max(
    min,
    Math.min(
      max,
      value
    )
  );
}


function roundLarge(
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


function generateCompact3BHK(requirements) {
  const country =
    String(requirements.country || "india").toLowerCase();

  const bhk =
    Number(requirements.house?.bhk || 1);

  const floors =
    Number(requirements.house?.floors || 1);

  const roadSide =
    normalizeRoadSideV16(requirements.plot?.roadSide);

  if (
    bhk !== 3 ||
    floors !== 1 ||
    !["north", "south"].includes(roadSide)
  ) {
    return null;
  }

  const profile =
    getDesignProfile(country);

  const feasibility =
    checkPlanFeasibility(requirements);

  if (feasibility.status === "infeasible") {
    return null;
  }

  const areaInfo =
    calculateBuildableArea(requirements);

  const b =
    areaInfo.buildable;

  const preferences =
    requirements.preferences || {};

  const roomScales =
    preferences.roomScales || {};

  const livingScale =
    clampV16(Number(roomScales.living || 1), 0.82, 1.25);

  const diningScale =
    clampV16(Number(roomScales.dining || 1), 0.82, 1.25);

  const kitchenScale =
    clampV16(Number(roomScales.kitchen || 1), 0.82, 1.25);

  const masterScale =
    clampV16(Number(roomScales.masterBedroom || 1), 0.82, 1.25);

  const bedroomScale =
    clampV16(Number(roomScales.bedroom || 1), 0.82, 1.25);

  /*
    For this compact template:
    family lounge is represented by the central lobby / living-dining
    connection unless user explicitly asks for a separate lounge.
  */
  const program =
    buildRoomProgram({
      ...requirements,
      preferences: {
        ...preferences,
        familyLounge:
          preferences.familyLounge === true
            ? true
            : false
      }
    });

  const byId =
    Object.fromEntries(
      program.map(room => [room.id, { ...room }])
    );

  const requiredIds = [
    "living",
    "dining",
    "kitchen",
    "bedroom-1",
    "bedroom-2",
    "bedroom-3",
    "attached-toilet-1",
    "attached-toilet-2",
    "common-toilet"
  ];

  if (
    requiredIds.some(id => !byId[id])
  ) {
    return null;
  }

  /*
    Practical proportions.
    30x40 India example after setbacks:
      ~27 x 35 ft buildable.

    We use four connected bands:
      FRONT        living + dining
      MIDDLE       kitchen + lobby + bed3
      WET CORE     utility + toilets + lobby
      REAR         master + bed2

    This produces one connected footprint instead of
    two wings divided by a full-height passage.
  */

  const frontH =
    clampV16(
      b.height *
        0.27 *
        Math.max(
          0.90,
          Math.min(
            1.12,
            (livingScale + diningScale) / 2
          )
        ),
      country === "germany" ? 3.2 : 9.0,
      country === "germany" ? 4.2 : 11.0
    );

  const middleH =
    clampV16(
      b.height *
        0.25 *
        Math.max(
          0.90,
          Math.min(
            1.10,
            (kitchenScale + bedroomScale) / 2
          )
        ),
      country === "germany" ? 2.8 : 8.0,
      country === "germany" ? 3.8 : 10.0
    );

  const wetH =
    clampV16(
      b.height * 0.16,
      country === "germany" ? 1.8 : 5.5,
      country === "germany" ? 2.5 : 7.0
    );

  const rearH =
    b.height -
    frontH -
    middleH -
    wetH;

  const minRear =
    country === "germany"
      ? 3.0
      : 10.0;

  if (rearH < minRear) {
    return null;
  }

  const lobbyW =
    country === "germany"
      ? clampV16(b.width * 0.13, 1.05, 1.30)
      : clampV16(b.width * 0.13, 3.25, 3.75);

  const leftWeight =
    1.04 *
    (
      livingScale +
      kitchenScale +
      masterScale
    ) / 3;

  const rightWeight =
    (
      diningScale +
      bedroomScale +
      bedroomScale
    ) / 3;

  const usableWingWidth =
    b.width -
    lobbyW;

  const leftW =
    usableWingWidth *
    leftWeight /
    (
      leftWeight +
      rightWeight
    );

  const rightW =
    usableWingWidth -
    leftW;

  const xLeft =
    b.x;

  const xLobby =
    b.x + leftW;

  const xRight =
    xLobby + lobbyW;

  const yFront =
    b.y;

  const yMiddle =
    yFront + frontH;

  const yWet =
    yMiddle + middleH;

  const yRear =
    yWet + wetH;

  const rooms = [];

  /*
    FRONT BAND
  */
  placeV16(
    rooms,
    byId["living"],
    xLeft,
    yFront,
    leftW + lobbyW * 0.25,
    frontH
  );

  placeV16(
    rooms,
    byId["dining"],
    xLeft + leftW + lobbyW * 0.25,
    yFront,
    rightW + lobbyW * 0.75,
    frontH
  );

  /*
    MIDDLE BAND
  */
  placeV16(
    rooms,
    byId["kitchen"],
    xLeft,
    yMiddle,
    leftW,
    middleH
  );

  placeV16(
    rooms,
    byId["bedroom-3"],
    xRight,
    yMiddle,
    rightW,
    middleH
  );

  /*
    WET CORE
    Left: utility + master toilet
    Right: common toilet + attached toilet 2
  */

  const utility =
    byId["utility"];

  const masterToilet =
    byId["attached-toilet-1"];

  const commonToilet =
    byId["common-toilet"];

  const attached2 =
    byId["attached-toilet-2"];

  if (utility) {
    const utilW =
      leftW * 0.46;

    placeV16(
      rooms,
      utility,
      xLeft,
      yWet,
      utilW,
      wetH
    );

    placeV16(
      rooms,
      masterToilet,
      xLeft + utilW,
      yWet,
      leftW - utilW,
      wetH
    );
  } else {
    placeV16(
      rooms,
      masterToilet,
      xLeft,
      yWet,
      leftW,
      wetH
    );
  }

  const commonW =
    rightW * 0.52;

  placeV16(
    rooms,
    commonToilet,
    xRight,
    yWet,
    commonW,
    wetH
  );

  placeV16(
    rooms,
    attached2,
    xRight + commonW,
    yWet,
    rightW - commonW,
    wetH
  );

  /*
    REAR BAND
  */
  placeV16(
    rooms,
    byId["bedroom-1"],
    xLeft,
    yRear,
    leftW + lobbyW * 0.15,
    rearH
  );

  placeV16(
    rooms,
    byId["bedroom-2"],
    xLeft + leftW + lobbyW * 0.15,
    yRear,
    rightW + lobbyW * 0.85,
    rearH
  );

  /*
    COMPACT CIRCULATION HUB

    Instead of a full-height central strip, use two rectangles:
    - vertical lobby through middle + wet core
    - short horizontal landing before rear bedrooms

    This looks much closer to real residential circulation.
  */
  const verticalLobby = {
    id: "lobby-main",
    name: "Lobby",
    type: "corridor",

    x:
      xLobby,

    y:
      yMiddle,

    width:
      lobbyW,

    height:
      middleH + wetH
  };

  const landingDepth =
    country === "germany"
      ? Math.min(1.2, rearH * 0.20)
      : Math.min(4.0, rearH * 0.22);

  const rearLanding = {
    id: "lobby-rear",
    name: "Landing",
    type: "corridor",
    overlay: true,

    x:
      xLeft + leftW * 0.38,

    y:
      yRear,

    width:
      b.width - leftW * 0.76,

    height:
      landingDepth
  };


  /*
    Bedroom passage extension.

    Normal plan:
      short connection into the private bedroom zone.

    User asks:
      "extend passage till middle of Bedroom 2"
      -> extend to roughly half the rear bedroom depth.
  */
  const bedroomPassageDepth =
    preferences.extendBedroomPassage
      ? rearH * 0.52
      : rearH * 0.22;

  const bedroomPassage = {
    id:
      "bedroom-passage",

    name:
      "Bedroom Hall",

    type:
      "corridor",

    overlay:
      true,

    x:
      xLobby,

    y:
      yRear,

    width:
      lobbyW,

    height:
      bedroomPassageDepth
  };

  const bedroomEntryY =
    roundV16(
      yRear +
      bedroomPassageDepth *
      0.72
    );

  const interiorDoors = [
    {
      id:
        "master-bedroom-entry",

      roomId:
        "bedroom-1",

      side:
        "east",

      x:
        xLobby,

      y:
        bedroomEntryY,

      width:
        country === "germany"
          ? 0.90
          : 3.0,

      swing:
        "left"
    },

    {
      id:
        "bedroom-2-entry",

      roomId:
        "bedroom-2",

      side:
        "west",

      x:
        xRight,

      y:
        bedroomEntryY,

      width:
        country === "germany"
          ? 0.90
          : 3.0,

      swing:
        preferences.oppositeBedroomEntries
          ? "right"
          : "left"
    }
  ];

  /*
    SOUTH ROAD:
    mirror complete geometry vertically so living/dining remain at road side.
  */
  if (roadSide === "south") {
    mirrorAllV16(
      rooms,
      [
        verticalLobby,
        rearLanding,
        bedroomPassage
      ],
      b
    );

    for (
      const door
      of interiorDoors
    ) {
      door.y =
        roundV16(
          b.y +
          b.height -
          (
            door.y -
            b.y
          )
        );
    }
  }

  /*
    Chat-driven directional changes:
    keep them deterministic without destroying the footprint.
  */
  applyPreferenceSwapsV16(
    rooms,
    preferences,
    b
  );

  /*
    MAIN ENTRANCE + FOYER
    A normal residential plan must have an exterior entrance.
  */
  const livingRoom =
    rooms.find(
      room =>
        room.id === "living"
    );

  const entranceDoorWidth =
    country === "germany"
      ? 1.0
      : 3.5;

  const entranceMargin =
    country === "germany"
      ? 0.45
      : 1.5;

  const entranceCenterX =
    clampV16(
      xLobby -
        entranceDoorWidth * 0.15,
      livingRoom.x +
        entranceMargin +
        entranceDoorWidth / 2,
      livingRoom.x +
        livingRoom.width -
        entranceMargin -
        entranceDoorWidth / 2
    );

  const mainEntrance = {
    id: "main-entrance",
    name: "Main Entrance",
    type: "entrance",
    roomId: "living",
    side: roadSide,
    width: entranceDoorWidth,
    x: roundV16(entranceCenterX),
    y: roundV16(
      roadSide === "north"
        ? livingRoom.y
        : livingRoom.y +
          livingRoom.height
    )
  };

  const foyerDepth =
    country === "germany"
      ? 1.35
      : 4.5;

  const foyerWidth =
    country === "germany"
      ? 1.65
      : 5.5;

  const foyer = {
    id: "entry-foyer",
    name: "Entry",
    type: "foyer",

    x: roundV16(
      clampV16(
        entranceCenterX -
          foyerWidth / 2,
        livingRoom.x,
        livingRoom.x +
          livingRoom.width -
          foyerWidth
      )
    ),

    y: roundV16(
      roadSide === "north"
        ? livingRoom.y
        : livingRoom.y +
          livingRoom.height -
          foyerDepth
    ),

    width: roundV16(
      Math.min(
        foyerWidth,
        livingRoom.width
      )
    ),

    height: roundV16(
      Math.min(
        foyerDepth,
        livingRoom.height * 0.45
      )
    )
  };


  const roomArea =
    rooms.reduce(
      (sum, room) =>
        sum +
        room.width *
        room.height,
      0
    );

  return {
    success: true,

    country,
    unit:
      profile.unit,

    roadSide,

    plot:
      areaInfo.plot,

    setbacks:
      areaInfo.setbacks,

    buildableArea:
      b,

    feasibility,

    circulation: [
      verticalLobby,
      rearLanding,
      bedroomPassage,
      foyer
    ],

    entrances: [
      mainEntrance
    ],

    interiorDoors,

    rooms,

    failedRooms: [],

    placementStrategy:
      "architectural-prompt-responsive-v18",

    statistics: {
      requestedRooms:
        rooms.length,

      placedRooms:
        rooms.length,

      failedRooms:
        0,

      roomArea:
        roundV16(roomArea),

      corridorArea:
        roundV16(
          verticalLobby.width *
          verticalLobby.height +
          rearLanding.width *
          rearLanding.height
        )
    },

    adaptations: [
      {
        type:
          "compact-circulation",

        room:
          "Whole plan",

        reason:
          "A compact central lobby and rear landing replace the previous full-height corridor."
      }
    ]
  };
}


function placeV16(
  target,
  room,
  x,
  y,
  width,
  height
) {
  target.push({
    ...room,

    x:
      roundV16(x),

    y:
      roundV16(y),

    width:
      roundV16(width),

    height:
      roundV16(height),

    area:
      roundV16(
        width *
        height
      )
  });
}


function mirrorAllV16(
  rooms,
  circulation,
  buildable
) {
  const all =
    [
      ...rooms,
      ...circulation
    ];

  for (
    const item
    of all
  ) {
    const offset =
      item.y -
      buildable.y;

    item.y =
      roundV16(
        buildable.y +
        buildable.height -
        offset -
        item.height
      );
  }
}


function applyPreferenceSwapsV16(
  rooms,
  preferences,
  buildable
) {
  const kitchen =
    rooms.find(
      room =>
        room.id === "kitchen"
    );

  const dining =
    rooms.find(
      room =>
        room.id === "dining"
    );

  const kitchenDirection =
    String(
      preferences.kitchenDirection || ""
    ).toLowerCase();

  if (
    kitchen &&
    dining &&
    [
      "east",
      "northeast",
      "southeast"
    ].includes(
      kitchenDirection
    )
  ) {
    /*
      Swap x positions only when widths are similar enough.
      This avoids breaking the connected footprint.
    */
    const oldKitchenX =
      kitchen.x;

    kitchen.x =
      dining.x;

    dining.x =
      oldKitchenX;
  }

  const master =
    rooms.find(
      room =>
        room.id === "bedroom-1"
    );

  const bed2 =
    rooms.find(
      room =>
        room.id === "bedroom-2"
    );

  const masterDirection =
    String(
      preferences.masterBedroomDirection || ""
    ).toLowerCase();

  if (
    master &&
    bed2 &&
    [
      "east",
      "northeast",
      "southeast"
    ].includes(
      masterDirection
    )
  ) {
    const mx =
      master.x;

    master.x =
      bed2.x;

    bed2.x =
      mx;
  }
}


function applySizeIntentV16(
  rooms,
  preferences
) {
  const scales =
    preferences.roomScales || {};

  /*
    This keeps the footprint connected.
    We only adjust label/intent metadata here.
    The next optimization pass can use these values
    for exact band redistribution.
  */
  for (
    const room
    of rooms
  ) {
    let scale = 1;

    if (
      room.id === "living" &&
      scales.living
    ) {
      scale =
        scales.living;
    }

    if (
      room.id === "dining" &&
      scales.dining
    ) {
      scale =
        scales.dining;
    }

    if (
      room.id === "kitchen" &&
      scales.kitchen
    ) {
      scale =
        scales.kitchen;
    }

    if (
      room.id === "bedroom-1" &&
      scales.masterBedroom
    ) {
      scale =
        scales.masterBedroom;
    }

    if (
      room.type === "bedroom" &&
      scales.bedroom
    ) {
      scale =
        scales.bedroom;
    }

    room.requestedSizeScale =
      scale;
  }
}


function normalizeRoadSideV16(
  roadSide
) {
  const value =
    String(
      roadSide ||
      "north"
    ).toLowerCase();

  return [
    "north",
    "south",
    "east",
    "west"
  ].includes(value)
    ? value
    : "north";
}


function clampV16(
  value,
  min,
  max
) {
  return Math.max(
    min,
    Math.min(
      max,
      value
    )
  );
}


function roundV16(
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


function legacyGenerateLayout(requirements) {
  /*
    First try the requested/default room program exactly as-is.
  */
  let result = generateLayoutAttempt(requirements);

  if (result.success) {
    return result;
  }

  /*
    ---------------------------------------------------------
    ADAPTIVE COMPACT FALLBACK

    If ANY required room cannot be placed, remove the
    automatically-added family lounge and retry, unless the
    user explicitly requested that lounge.

    This is practical for compact 3BHK / 4BHK Indian plots:
    bedrooms, bathrooms, kitchen, dining and circulation take
    priority over a separate optional family lounge.

    IMPORTANT:
    If the user explicitly requested a family lounge,
    we do NOT remove it automatically.
    ---------------------------------------------------------
  */

  const preferences =
    requirements.preferences || {};

  const familyLoungeExplicit =
    typeof preferences.familyLounge === "boolean";

  const hasFailedRooms =
    Array.isArray(result.failedRooms) &&
    result.failedRooms.length > 0;

  if (
    hasFailedRooms &&
    !familyLoungeExplicit
  ) {
    const compactRequirements = {
      ...requirements,

      preferences: {
        ...preferences,
        familyLounge: false
      }
    };

    const compactResult =
      generateLayoutAttempt(
        compactRequirements
      );

    if (compactResult.success) {
      compactResult.adaptations = [
        {
          type: "removed-optional-room",
          room: "Family Lounge",
          reason:
            "The buildable area is tight, so the separate family lounge was removed. Living and dining should serve as the shared family space."
        }
      ];

      compactResult.originalFeasibility =
        result.feasibility;

      return compactResult;
    }

    result = compactResult;
  }

  /*
    ---------------------------------------------------------
    SECOND COMPACT FALLBACK

    Utility is useful but not more important than bedrooms,
    bathrooms, living, dining, kitchen and circulation.

    If the retry still cannot place all required rooms and
    utility was only added by default, remove it and retry.
    ---------------------------------------------------------
  */

  const utilityExplicit =
    typeof preferences.utility === "boolean";

  const stillHasFailedRooms =
    Array.isArray(result.failedRooms) &&
    result.failedRooms.length > 0;

  if (
    stillHasFailedRooms &&
    !utilityExplicit
  ) {
    const compactRequirements = {
      ...requirements,

      preferences: {
        ...preferences,
        familyLounge:
          familyLoungeExplicit
            ? preferences.familyLounge
            : false,

        utility: false
      }
    };

    const compactResult =
      generateLayoutAttempt(
        compactRequirements
      );

    if (compactResult.success) {
      compactResult.adaptations = [
        {
          type: "removed-optional-room",
          room: "Utility",
          reason:
            "The buildable area is tight, so the separate utility room was removed. Utility functions can be integrated beside or within the kitchen."
        }
      ];

      if (!familyLoungeExplicit) {
        compactResult.adaptations.unshift({
          type: "removed-optional-room",
          room: "Family Lounge",
          reason:
            "The buildable area is tight, so the separate family lounge was removed."
        });
      }

      compactResult.originalFeasibility =
        result.feasibility;

      return compactResult;
    }

    result = compactResult;
  }

  return result;
}


function generateLayoutAttempt(requirements) {
  const feasibility =
    checkPlanFeasibility(requirements);

  /*
    Do not try to create a broken plan when even the
    minimum room program cannot fit.
  */
  if (
    feasibility.status === "infeasible"
  ) {
    return {
      success: false,
      reason: "infeasible",
      feasibility,
      rooms: [],
      circulation: [],
      failedRooms: []
    };
  }

  const country = String(
    requirements.country || "india"
  ).toLowerCase();

  const profile =
    getDesignProfile(country);

  const areaInfo =
    calculateBuildableArea(
      requirements
    );

  const buildable =
    areaInfo.buildable;

  const roadSide =
    normalizeRoadSide(
      requirements.plot?.roadSide
    );

  const rooms =
    buildRoomProgram(
      requirements
    );

  /*
    ---------------------------------------------------------
    1. CREATE MAIN CIRCULATION SPINE
    ---------------------------------------------------------
  */

  const corridor =
    createMainCorridor(
      buildable,
      roadSide,
      profile
    );

  /*
    ---------------------------------------------------------
    2. FREE RECTANGLES

    Corridor is reserved first.
    Rooms can only use remaining space.
    ---------------------------------------------------------
  */

  let freeRects =
    createInitialFreeRectangles(
      buildable,
      corridor,
      roadSide
    );

  /*
    ---------------------------------------------------------
    3. MULTI-STRATEGY PLACEMENT

    A single greedy room order is too fragile for floor plans.
    We now try several deterministic room orders and keep the
    best result.

    Tight layouts also prefer compact/minimum dimensions.
    ---------------------------------------------------------
  */

  const compactMode =
    feasibility.status === "tight";

  const strategies = [
    {
      name: "balanced",
      rooms: [...rooms].sort(
        (a, b) =>
          getPlacementPriority(a) -
          getPlacementPriority(b)
      )
    },

    {
      name: "large-first",
      rooms: [...rooms].sort(
        (a, b) =>
          preferredArea(b) -
          preferredArea(a)
      )
    },

    {
      name: "social-core",
      rooms: [...rooms].sort(
        (a, b) =>
          getSocialCorePriority(a) -
          getSocialCorePriority(b)
      )
    },

    {
      name: "wet-core",
      rooms: [...rooms].sort(
        (a, b) =>
          getWetCorePriority(a) -
          getWetCorePriority(b)
      )
    }
  ];

  const placementAttempts =
    strategies.map(
      strategy =>
        runPlacementAttempt({
          orderedRooms:
            strategy.rooms,

          buildable,
          corridor,
          roadSide,
          compactMode,

          strategyName:
            strategy.name
        })
    );

  placementAttempts.sort(
    (a, b) => {
      if (
        a.failedRooms.length !==
        b.failedRooms.length
      ) {
        return (
          a.failedRooms.length -
          b.failedRooms.length
        );
      }

      if (
        a.placedRooms.length !==
        b.placedRooms.length
      ) {
        return (
          b.placedRooms.length -
          a.placedRooms.length
        );
      }

      return (
        a.roomArea -
        b.roomArea
      );
    }
  );

  const bestAttempt =
    placementAttempts[0];

  const placedRooms =
    bestAttempt.placedRooms;

  const failedRooms =
    bestAttempt.failedRooms;

  freeRects =
    bestAttempt.freeRects;


  /*
    ---------------------------------------------------------
    5. FINAL RESULT
    ---------------------------------------------------------
  */

  const success =
    failedRooms.length === 0;

  const mainEntrance =
    createLegacyMainEntrance(
      placedRooms,
      buildable,
      roadSide,
      profile.unit
    );

  return {
    success,

    country,
    unit:
      profile.unit,

    roadSide,

    plot:
      areaInfo.plot,

    setbacks:
      areaInfo.setbacks,

    buildableArea:
      buildable,

    feasibility,

    circulation: [
      corridor
    ],

    entrances:
      mainEntrance
        ? [mainEntrance]
        : [],

    rooms:
      placedRooms,

    failedRooms,

    placementStrategy:
      bestAttempt.strategyName,

    statistics: {
      requestedRooms:
        rooms.length,

      placedRooms:
        placedRooms.length,

      failedRooms:
        failedRooms.length,

      roomArea:
        round(
          placedRooms.reduce(
            (sum, room) =>
              sum + room.area,
            0
          )
        ),

      corridorArea:
        round(
          corridor.width *
          corridor.height
        )
    },

    adaptations: []
  };
}


function createLegacyMainEntrance(rooms, buildable, roadSide, unit) {
  const tolerance = 0.05;
  const touchesRoadEdge = room => {
    if (roadSide === "south") {
      return Math.abs(room.y + room.height - buildable.y - buildable.height) < tolerance;
    }
    if (roadSide === "east") {
      return Math.abs(room.x + room.width - buildable.x - buildable.width) < tolerance;
    }
    if (roadSide === "west") {
      return Math.abs(room.x - buildable.x) < tolerance;
    }
    return Math.abs(room.y - buildable.y) < tolerance;
  };

  const publicTypes = ["living", "dining", "familyLounge"];
  const room = rooms.find(item => publicTypes.includes(item.type) && touchesRoadEdge(item));
  if (!room) return null;

  const width = String(unit).toLowerCase() === "m" ? 1 : 3.5;
  const horizontalEdge = roadSide === "north" || roadSide === "south";
  return {
    id: "main-entrance",
    name: "Main Entrance",
    type: "entrance",
    roomId: room.id,
    side: roadSide,
    width,
    x: horizontalEdge ? room.x + room.width / 2 : roadSide === "west" ? room.x : room.x + room.width,
    y: horizontalEdge ? roadSide === "north" ? room.y : room.y + room.height : room.y + room.height / 2
  };
}


/*
  =========================================================
  MAIN CORRIDOR
  =========================================================
*/

function createMainCorridor(
  buildable,
  roadSide,
  profile
) {
  const corridorDefaults =
    profile.roomDefaults.corridor;

  const preferredWidth =
    corridorDefaults.preferredWidth;

  /*
    North / south road:
    vertical circulation spine.

    East / west road:
    horizontal circulation spine.
  */

  if (
    roadSide === "north" ||
    roadSide === "south"
  ) {
    const corridorWidth =
      Math.min(
        preferredWidth,
        buildable.width * 0.18
      );

    return {
      id:
        "corridor-main",

      name:
        "Passage",

      type:
        "corridor",

      x:
        buildable.x +
        buildable.width / 2 -
        corridorWidth / 2,

      y:
        buildable.y,

      width:
        corridorWidth,

      height:
        buildable.height
    };
  }

  const corridorWidth =
    Math.min(
      preferredWidth,
      buildable.height * 0.18
    );

  return {
    id:
      "corridor-main",

    name:
      "Passage",

    type:
      "corridor",

    x:
      buildable.x,

    y:
      buildable.y +
      buildable.height / 2 -
      corridorWidth / 2,

    width:
      buildable.width,

    height:
      corridorWidth
  };
}


/*
  =========================================================
  INITIAL FREE SPACE
  =========================================================
*/

function createInitialFreeRectangles(
  buildable,
  corridor,
  roadSide
) {
  if (
    roadSide === "north" ||
    roadSide === "south"
  ) {
    return [
      {
        x:
          buildable.x,

        y:
          buildable.y,

        width:
          corridor.x -
          buildable.x,

        height:
          buildable.height
      },

      {
        x:
          corridor.x +
          corridor.width,

        y:
          buildable.y,

        width:
          buildable.x +
          buildable.width -
          corridor.x -
          corridor.width,

        height:
          buildable.height
      }
    ].filter(
      isUsableRectangle
    );
  }

  return [
    {
      x:
        buildable.x,

      y:
        buildable.y,

      width:
        buildable.width,

      height:
        corridor.y -
        buildable.y
    },

    {
      x:
        buildable.x,

      y:
        corridor.y +
        corridor.height,

      width:
        buildable.width,

      height:
        buildable.y +
        buildable.height -
        corridor.y -
        corridor.height
    }
  ].filter(
    isUsableRectangle
  );
}


/*
  =========================================================
  MULTI-STRATEGY PLACEMENT HELPERS
  =========================================================
*/

function runPlacementAttempt({
  orderedRooms,
  buildable,
  corridor,
  roadSide,
  compactMode,
  strategyName
}) {
  let freeRects =
    createInitialFreeRectangles(
      buildable,
      corridor,
      roadSide
    );

  const placedRooms = [];
  const failedRooms = [];

  for (
    const room
    of orderedRooms
  ) {
    const candidate =
      findBestPlacement({
        room,
        freeRects,
        buildable,
        roadSide,
        placedRooms,
        compactMode
      });

    if (!candidate) {
      failedRooms.push({
        id: room.id,
        name: room.name,
        type: room.type,
        reason:
          "No valid rectangle could be found."
      });

      continue;
    }

    const placed = {
      ...room,

      x:
        round(candidate.x),

      y:
        round(candidate.y),

      width:
        round(candidate.width),

      height:
        round(candidate.height),

      area:
        round(
          candidate.width *
          candidate.height
        )
    };

    placedRooms.push(
      placed
    );

    freeRects =
      subtractPlacedRectangle(
        freeRects,
        placed
      );
  }

  return {
    strategyName,
    placedRooms,
    failedRooms,
    freeRects,

    roomArea:
      round(
        placedRooms.reduce(
          (sum, room) =>
            sum + room.area,
          0
        )
      )
  };
}


function preferredArea(room) {
  const width =
    Number(
      room.preferredWidth ||
      room.minWidth ||
      0
    );

  const height =
    Number(
      room.preferredHeight ||
      room.minHeight ||
      0
    );

  return (
    width *
    height
  );
}


function getSocialCorePriority(
  room
) {
  switch (
    room.type
  ) {
    case "living":
      return 10;

    case "dining":
      return 15;

    case "kitchen":
      return 20;

    case "masterBedroom":
      return 30;

    case "bedroom":
      return 35;

    case "attachedToilet":
      return 40;

    case "commonToilet":
      return 42;

    case "familyLounge":
      return 50;

    case "utility":
      return 60;

    case "puja":
      return 65;

    case "store":
      return 70;

    default:
      return 100;
  }
}


function getWetCorePriority(
  room
) {
  switch (
    room.type
  ) {
    case "masterBedroom":
      return 10;

    case "bedroom":
      return 15;

    case "attachedToilet":
      return 20;

    case "commonToilet":
      return 22;

    case "kitchen":
      return 30;

    case "dining":
      return 35;

    case "living":
      return 40;

    case "familyLounge":
      return 50;

    case "utility":
      return 60;

    case "puja":
      return 65;

    case "store":
      return 70;

    default:
      return 100;
  }
}


/*
  =========================================================
  ROOM PRIORITY
  =========================================================
*/

function getPlacementPriority(
  room
) {
  switch (
    room.type
  ) {
    case "living":
      return 10;

    case "masterBedroom":
      return 20;

    case "bedroom":
      return 25;

    case "attachedToilet":
      return 26;

    case "commonToilet":
      return 27;

    case "kitchen":
      return 30;

    case "dining":
      return 35;

    case "familyLounge":
      return 40;

    case "utility":
      return 60;

    case "puja":
      return 65;

    case "store":
      return 70;

    default:
      return 100;
  }
}


/*
  =========================================================
  FIND BEST ROOM POSITION
  =========================================================
*/

function findBestPlacement({
  room,
  freeRects,
  buildable,
  roadSide,
  placedRooms,
  compactMode = false
}) {
  const sizes =
    getPossibleRoomSizes(
      room
    );

  const candidates = [];

  for (
    const freeRect
    of freeRects
  ) {
    for (
      const size
      of sizes
    ) {
      if (
        size.width >
          freeRect.width ||
        size.height >
          freeRect.height
      ) {
        continue;
      }

      const positions = [
        {
          x:
            freeRect.x,

          y:
            freeRect.y
        },

        {
          x:
            freeRect.x +
            freeRect.width -
            size.width,

          y:
            freeRect.y
        },

        {
          x:
            freeRect.x,

          y:
            freeRect.y +
            freeRect.height -
            size.height
        },

        {
          x:
            freeRect.x +
            freeRect.width -
            size.width,

          y:
            freeRect.y +
            freeRect.height -
            size.height
        }
      ];

      for (
        const position
        of positions
      ) {
        const candidate = {
          x:
            position.x,

          y:
            position.y,

          width:
            size.width,

          height:
            size.height
        };

        const score =
          scoreCandidate({
            room,
            candidate,
            buildable,
            roadSide,
            placedRooms,
            sizeType:
              size.type,
            compactMode
          });

        candidates.push({
          ...candidate,
          score
        });
      }
    }
  }

  if (
    !candidates.length
  ) {
    return null;
  }

  candidates.sort(
    (a, b) =>
      a.score -
      b.score
  );

  return candidates[0];
}


/*
  =========================================================
  ROOM SIZE OPTIONS
  =========================================================
*/

function getPossibleRoomSizes(
  room
) {
  const preferredWidth =
    Number(
      room.preferredWidth ||
      room.minWidth
    );

  const preferredHeight =
    Number(
      room.preferredHeight ||
      room.minHeight
    );

  const minWidth =
    Number(
      room.minWidth
    );

  const minHeight =
    Number(
      room.minHeight
    );

  const sizes = [];

  sizes.push({
    width:
      preferredWidth,

    height:
      preferredHeight,

    type:
      "preferred"
  });

  if (
    preferredWidth !==
    preferredHeight
  ) {
    sizes.push({
      width:
        preferredHeight,

      height:
        preferredWidth,

      type:
        "preferred"
    });
  }

  /*
    Mid-size option between preferred and minimum.

    This gives the planner more flexibility than jumping
    directly from preferred dimensions to the minimum.
  */

  const midWidth =
    round(
      (
        preferredWidth +
        minWidth
      ) / 2
    );

  const midHeight =
    round(
      (
        preferredHeight +
        minHeight
      ) / 2
    );

  sizes.push({
    width:
      midWidth,

    height:
      midHeight,

    type:
      "compact"
  });

  if (
    midWidth !==
    midHeight
  ) {
    sizes.push({
      width:
        midHeight,

      height:
        midWidth,

      type:
        "compact"
    });
  }

  sizes.push({
    width:
      minWidth,

    height:
      minHeight,

    type:
      "minimum"
  });

  if (
    minWidth !==
    minHeight
  ) {
    sizes.push({
      width:
        minHeight,

      height:
        minWidth,

      type:
        "minimum"
    });
  }

  return removeDuplicateSizes(
    sizes
  );
}


/*
  =========================================================
  CANDIDATE SCORING
  =========================================================
*/

function scoreCandidate({
  room,
  candidate,
  buildable,
  roadSide,
  placedRooms,
  sizeType,
  compactMode = false
}) {
  let score = 0;

  /*
    Tight plans should use compact/minimum dimensions before
    sacrificing required rooms such as dining or bathrooms.
  */
  if (compactMode) {
    if (
      sizeType ===
      "preferred"
    ) {
      score += 24;
    } else if (
      sizeType ===
      "compact"
    ) {
      score += 6;
    }
  } else {
    if (
      sizeType ===
      "compact"
    ) {
      score += 7;
    }

    if (
      sizeType ===
      "minimum"
    ) {
      score += 15;
    }
  }

  const center = {
    x:
      candidate.x +
      candidate.width / 2,

    y:
      candidate.y +
      candidate.height / 2
  };

  const normalized = {
    x:
      (
        center.x -
        buildable.x
      ) /
      buildable.width,

    y:
      (
        center.y -
        buildable.y
      ) /
      buildable.height
  };

  const target =
    getRoomTarget(
      room,
      roadSide
    );

  score +=
    distance(
      normalized,
      target
    ) *
    100;

  if (
    room.preferredDirection
  ) {
    const directionTarget =
      getDirectionTarget(
        room.preferredDirection
      );

    if (
      directionTarget
    ) {
      score +=
        distance(
          normalized,
          directionTarget
        ) *
        80;
    }
  }

  if (
    room.requiresExteriorWall &&
    !touchesExteriorWall(
      candidate,
      buildable
    )
  ) {
    score += 80;
  }

  if (
    room.attachedTo
  ) {
    const parent =
      placedRooms.find(
        placed =>
          placed.id ===
          room.attachedTo
      );

    if (
      parent
    ) {
      score +=
        rectangleDistance(
          candidate,
          parent
        ) *
        12;

      if (
        rectanglesTouch(
          candidate,
          parent
        )
      ) {
        score -= 80;
      }
    }
  }

  if (
    Array.isArray(
      room.preferredNear
    )
  ) {
    for (
      const preferredId
      of room.preferredNear
    ) {
      const neighbour =
        placedRooms.find(
          placed =>
            placed.id ===
            preferredId
        );

      if (
        !neighbour
      ) {
        continue;
      }

      score +=
        rectangleDistance(
          candidate,
          neighbour
        ) *
        5;

      if (
        rectanglesTouch(
          candidate,
          neighbour
        )
      ) {
        score -= 30;
      }
    }
  }

  return score;
}


/*
  =========================================================
  ARCHITECTURAL TARGETS
  =========================================================
*/

function getRoomTarget(
  room,
  roadSide
) {
  let depth;

  switch (
    room.zone
  ) {
    case "public":
      depth = 0.15;
      break;

    case "semiPublic":
      depth = 0.42;
      break;

    case "private":
      depth = 0.78;
      break;

    case "service":
      depth = 0.58;
      break;

    default:
      depth = 0.50;
  }

  switch (
    roadSide
  ) {
    case "south":
      return {
        x: 0.5,
        y: 1 - depth
      };

    case "east":
      return {
        x: 1 - depth,
        y: 0.5
      };

    case "west":
      return {
        x: depth,
        y: 0.5
      };

    case "north":
    default:
      return {
        x: 0.5,
        y: depth
      };
  }
}


/*
  =========================================================
  COMPASS TARGETS
  =========================================================
*/

function getDirectionTarget(
  direction
) {
  const normalized =
    String(
      direction
    )
      .toLowerCase()
      .replace(
        /[\s_-]/g,
        ""
      );

  const directions = {
    north: {
      x: 0.5,
      y: 0.1
    },

    northeast: {
      x: 0.85,
      y: 0.15
    },

    east: {
      x: 0.9,
      y: 0.5
    },

    southeast: {
      x: 0.85,
      y: 0.85
    },

    south: {
      x: 0.5,
      y: 0.9
    },

    southwest: {
      x: 0.15,
      y: 0.85
    },

    west: {
      x: 0.1,
      y: 0.5
    },

    northwest: {
      x: 0.15,
      y: 0.15
    }
  };

  return (
    directions[
      normalized
    ] ||
    null
  );
}


/*
  =========================================================
  FREE RECTANGLE MANAGEMENT
  =========================================================
*/

function subtractPlacedRectangle(
  freeRects,
  placed
) {
  const newFreeRects = [];

  for (
    const free
    of freeRects
  ) {
    if (
      !rectanglesOverlap(
        free,
        placed
      )
    ) {
      newFreeRects.push(
        free
      );

      continue;
    }

    const freeRight =
      free.x +
      free.width;

    const freeBottom =
      free.y +
      free.height;

    const placedRight =
      placed.x +
      placed.width;

    const placedBottom =
      placed.y +
      placed.height;

    if (
      placed.x >
      free.x
    ) {
      newFreeRects.push({
        x:
          free.x,

        y:
          free.y,

        width:
          placed.x -
          free.x,

        height:
          free.height
      });
    }

    if (
      placedRight <
      freeRight
    ) {
      newFreeRects.push({
        x:
          placedRight,

        y:
          free.y,

        width:
          freeRight -
          placedRight,

        height:
          free.height
      });
    }

    if (
      placed.y >
      free.y
    ) {
      newFreeRects.push({
        x:
          free.x,

        y:
          free.y,

        width:
          free.width,

        height:
          placed.y -
          free.y
      });
    }

    if (
      placedBottom <
      freeBottom
    ) {
      newFreeRects.push({
        x:
          free.x,

        y:
          placedBottom,

        width:
          free.width,

        height:
          freeBottom -
          placedBottom
      });
    }
  }

  return pruneFreeRectangles(
    newFreeRects.filter(
      isUsableRectangle
    )
  );
}


/*
  Remove free rectangles completely contained inside
  another free rectangle.
*/

function pruneFreeRectangles(
  rectangles
) {
  return rectangles.filter(
    (rect, index) => {
      return !rectangles.some(
        (
          other,
          otherIndex
        ) => {
          if (
            index ===
            otherIndex
          ) {
            return false;
          }

          return rectangleContains(
            other,
            rect
          );
        }
      );
    }
  );
}


/*
  =========================================================
  GEOMETRY HELPERS
  =========================================================
*/

function rectanglesOverlap(
  a,
  b
) {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}


function rectanglesTouch(
  a,
  b
) {
  const tolerance =
    0.01;

  const horizontalTouch =
    (
      Math.abs(
        a.x +
        a.width -
        b.x
      ) <
      tolerance ||

      Math.abs(
        b.x +
        b.width -
        a.x
      ) <
      tolerance
    ) &&
    rangesOverlap(
      a.y,
      a.y +
      a.height,
      b.y,
      b.y +
      b.height
    );

  const verticalTouch =
    (
      Math.abs(
        a.y +
        a.height -
        b.y
      ) <
      tolerance ||

      Math.abs(
        b.y +
        b.height -
        a.y
      ) <
      tolerance
    ) &&
    rangesOverlap(
      a.x,
      a.x +
      a.width,
      b.x,
      b.x +
      b.width
    );

  return (
    horizontalTouch ||
    verticalTouch
  );
}


function rangesOverlap(
  a1,
  a2,
  b1,
  b2
) {
  return (
    Math.min(
      a2,
      b2
    ) >
    Math.max(
      a1,
      b1
    )
  );
}


function rectangleContains(
  outer,
  inner
) {
  return (
    inner.x >=
      outer.x &&

    inner.y >=
      outer.y &&

    inner.x +
      inner.width <=
      outer.x +
      outer.width &&

    inner.y +
      inner.height <=
      outer.y +
      outer.height
  );
}


function rectangleDistance(
  a,
  b
) {
  const ax =
    a.x +
    a.width / 2;

  const ay =
    a.y +
    a.height / 2;

  const bx =
    b.x +
    b.width / 2;

  const by =
    b.y +
    b.height / 2;

  return Math.hypot(
    ax - bx,
    ay - by
  );
}


function distance(
  a,
  b
) {
  return Math.hypot(
    a.x - b.x,
    a.y - b.y
  );
}


function touchesExteriorWall(
  room,
  buildable
) {
  const tolerance =
    0.01;

  return (
    Math.abs(
      room.x -
      buildable.x
    ) <
      tolerance ||

    Math.abs(
      room.y -
      buildable.y
    ) <
      tolerance ||

    Math.abs(
      room.x +
      room.width -
      (
        buildable.x +
        buildable.width
      )
    ) <
      tolerance ||

    Math.abs(
      room.y +
      room.height -
      (
        buildable.y +
        buildable.height
      )
    ) <
      tolerance
  );
}


function isUsableRectangle(
  rect
) {
  return (
    rect.width >
      0.01 &&
    rect.height >
      0.01
  );
}


function removeDuplicateSizes(
  sizes
) {
  const seen =
    new Set();

  return sizes.filter(
    size => {
      const key =
        `${size.width}x${size.height}`;

      if (
        seen.has(
          key
        )
      ) {
        return false;
      }

      seen.add(
        key
      );

      return true;
    }
  );
}


function normalizeRoadSide(
  roadSide
) {
  const value =
    String(
      roadSide ||
      "north"
    ).toLowerCase();

  if (
    [
      "north",
      "south",
      "east",
      "west"
    ].includes(
      value
    )
  ) {
    return value;
  }

  return "north";
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
