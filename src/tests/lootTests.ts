import { rollDrop, rollGoldChestLoot, rollGrayChestLoot } from '../logic/loot';

export function runLootTests() {
  console.group('🧪 RUNNING LOOT TESTS');

  // Test 1: Gold Chest Loot
  console.group('Test 1: Gold Chest Loot (100 runs)');
  let goldChestResults = {
    totalItems: 0,
    items: 0,
    shields: 0,
    goldCoins: 0,
    keys: 0,
    bombs: 0,
    empty: 0,
  };

  for (let i = 0; i < 100; i++) {
    const loot = rollGoldChestLoot(2); // Assume variety 2 for Gold Chests
    if (loot.length === 0) goldChestResults.empty++;
    goldChestResults.totalItems += loot.length;
    
    loot.forEach(l => {
      if (l.type === 'item') goldChestResults.items++;
      else if (l.type === 'shield') goldChestResults.shields++;
      else if (l.type === 'coin' && l.value === 10) goldChestResults.goldCoins++;
      else if (l.type === 'key') goldChestResults.keys++;
      else if (l.type === 'bomb') goldChestResults.bombs++;
    });
  }
  
  console.table(goldChestResults);
  if (goldChestResults.empty > 0) {
    console.error('❌ FAILURE: Some Gold Chests returned EMPTY loot!');
  } else {
    console.log('✅ SUCCESS: All Gold Chests had loot.');
  }
  
  // Check distributions
  const total = goldChestResults.totalItems;
  console.log(`Distribution: Items ${(goldChestResults.items / total * 100).toFixed(1)}% (Target ~35%), Consumables ${(100 - goldChestResults.items / total * 100).toFixed(1)}%`);
  console.groupEnd();


  // Test 2: Gray Chest Loot
  console.group('Test 2: Gray Chest Loot (100 runs)');
  let grayChestEmpty = 0;
  for (let i = 0; i < 100; i++) {
    const loot = rollGrayChestLoot(1);
    if (loot.length === 0) grayChestEmpty++;
  }
  if (grayChestEmpty > 0) {
    console.error('❌ FAILURE: Some Gray Chests were empty!');
  } else {
    console.log('✅ SUCCESS: Gray Chests reliable.');
  }
  console.groupEnd();

  // Test 3: Drop Rates
  console.group('Test 3: Enemy Drop Rates (1000 runs)');
  const drops = {
    nothing: 0,
    health: 0,
    shield: 0,
    coin: 0,
    key: 0,
    bomb: 0,
    chest: 0,
    enemy: 0
  };

  for (let i = 0; i < 1000; i++) {
    const res = rollDrop();
    if (!res) drops.nothing++;
    else drops[res.type as keyof typeof drops]++;
  }
  console.table(drops);
  console.groupEnd();
  
  console.groupEnd();
  return "Tests Completed";
}

// Expose to window for manual run
(window as any).runLootTests = runLootTests;
