import { PIN_ORDER } from "./pinLayout";

function fullRack(): Set<number> {
  return new Set<number>(PIN_ORDER);
}

function knockFromRack(standing: Set<number>, count: number): number[] {
  const knocked: number[] = [];
  for (const p of PIN_ORDER) {
    if (knocked.length >= count) break;
    if (standing.has(p)) {
      standing.delete(p);
      knocked.push(p);
    }
  }
  return knocked;
}

function pushStep(
  steps: RollPinStep[],
  globalRoll: { n: number },
  frame: number,
  rollInFrame: number,
  pinsDown: number,
  standing: Set<number>,
  knocked: number[]
) {
  steps.push({
    rollIndex: globalRoll.n++,
    frame,
    rollInFrame,
    pinsDownThisRoll: pinsDown,
    standing: PIN_ORDER.filter((p) => standing.has(p)),
    knockedThisRoll: knocked,
  });
}

export interface RollPinStep {
  rollIndex: number;
  frame: number;
  rollInFrame: number;
  pinsDownThisRoll: number;
  standing: number[];
  knockedThisRoll: number[];
}

/** Step through each roll of a completed game for pin visualization. */
export function buildGamePinSteps(allRolls: number[]): RollPinStep[] {
  const steps: RollPinStep[] = [];
  const globalRoll = { n: 0 };
  let rollIndex = 0;

  for (let f = 0; f < 9; f++) {
    const standing = fullRack();
    const r1 = allRolls[rollIndex];
    pushStep(
      steps,
      globalRoll,
      f + 1,
      1,
      r1,
      standing,
      knockFromRack(standing, r1)
    );
    rollIndex += 1;
    if (r1 === 10) continue;
    const r2 = allRolls[rollIndex];
    pushStep(
      steps,
      globalRoll,
      f + 1,
      2,
      r2,
      standing,
      knockFromRack(standing, r2)
    );
    rollIndex += 1;
  }

  const r1 = allRolls[rollIndex];
  let standing = fullRack();
  pushStep(
    steps,
    globalRoll,
    10,
    1,
    r1,
    standing,
    knockFromRack(standing, r1)
  );
  rollIndex += 1;

  if (r1 === 10) {
    standing = fullRack();
    const r2 = allRolls[rollIndex];
    pushStep(
      steps,
      globalRoll,
      10,
      2,
      r2,
      standing,
      knockFromRack(standing, r2)
    );
    rollIndex += 1;
    if (r2 === 10) {
      standing = fullRack();
      const r3 = allRolls[rollIndex];
      pushStep(
        steps,
        globalRoll,
        10,
        3,
        r3,
        standing,
        knockFromRack(standing, r3)
      );
      rollIndex += 1;
    } else {
      const r3 = allRolls[rollIndex];
      pushStep(
        steps,
        globalRoll,
        10,
        3,
        r3,
        standing,
        knockFromRack(standing, r3)
      );
      rollIndex += 1;
    }
  } else {
    const r2 = allRolls[rollIndex];
    pushStep(
      steps,
      globalRoll,
      10,
      2,
      r2,
      standing,
      knockFromRack(standing, r2)
    );
    rollIndex += 1;
    if (r1 + r2 === 10) {
      standing = fullRack();
      const r3 = allRolls[rollIndex];
      pushStep(
        steps,
        globalRoll,
        10,
        3,
        r3,
        standing,
        knockFromRack(standing, r3)
      );
      rollIndex += 1;
    }
  }

  return steps;
}
