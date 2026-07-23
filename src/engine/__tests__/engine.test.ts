import { calculateTargetProgress, parseWorldSeed, upgradeSeedTo128bit } from '../rng';
import { solveAnvilSteps, validateRules } from '../solver';

// Quick verification runner
function runUnitTests() {
  console.log('--- Running TFC Anvil Engine Unit Tests ---');

  // Test 1: Seed Parsing
  const numericSeed = parseWorldSeed('12345');
  const stringSeed = parseWorldSeed('my_tfc_world');
  console.assert(numericSeed === 12345n, 'Numeric seed parsing failed');
  console.assert(stringSeed !== 0n, 'String seed hashing failed');

  // Test 2: Target Progress bounds (40 to 113) & User Verification Seed
  const target1 = calculateTargetProgress('12345', 'tfc:anvil/axe_head/bismuth_bronze');
  const target2 = calculateTargetProgress(987654321, 'tfc:anvil/pickaxe_head/steel');
  const userTestTarget = calculateTargetProgress('2072155467655014878', 'tfc:anvil/bismuth_bronze_sheet');
  
  console.assert(target1 >= 40 && target1 <= 113, `Target 1 out of bounds: ${target1}`);
  console.assert(target2 >= 40 && target2 <= 113, `Target 2 out of bounds: ${target2}`);
  console.assert(userTestTarget === 60, `User test seed target failed! Expected 60, got ${userTestTarget}`);

  // Test 3: Solver with Rules
  const targetVal = 75;
  const rules = ['punch_last', 'hit_second_last', 'upset_third_last'];
  const res = solveAnvilSteps(targetVal, rules);

  console.assert(res.success, 'Solver failed to find path');
  console.assert(res.totalSteps > 0, 'Solver steps count should be > 0');
  
  // Calculate total value of steps
  const total = res.steps.reduce((sum, act) => {
    const valMap: Record<string, number> = {
      PUNCH: 2, BEND: 7, UPSET: 13, SHRINK: 16, DRAW: -15,
      HIT_LIGHT: -3, HIT_MEDIUM: -6, HIT_HEAVY: -9
    };
    return sum + valMap[act];
  }, 0);

  console.assert(total === targetVal, `Solver path total (${total}) does not match target (${targetVal})`);
  console.assert(validateRules(res.steps, rules), 'Solver path does not satisfy mandatory rules');

  console.log('✅ All Unit Tests Passed Successfully!');
}

runUnitTests();
