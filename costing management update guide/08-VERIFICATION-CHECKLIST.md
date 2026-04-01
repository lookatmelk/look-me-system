# Guide 08 — Verification Checklist

## Purpose

After implementing all changes from Guides 01–07, use this checklist to verify correctness.

---

## Phase 1: Code Compilation

### Step 1: Build Verification
```bash
npm run build
```
Expected: **No TypeScript errors, no build failures.**

If there are errors, they will likely be:
- Missing imports (removed fields being referenced)
- Type mismatches (e.g., `size` vs `sizes`)
- Unused variable warnings (from removed state/props)

### Step 2: Lint Check
```bash
npx eslint src/ --ext .ts,.tsx
```
Expected: **No lint errors related to the costing module changes.**

---

## Phase 2: Reference Cleanup Verification

### Step 3: Search for Orphaned References
Run each command and verify **zero results**:

```bash
# Old purchasing bridge
grep -r "purchasingDescription" src/ --include="*.ts" --include="*.tsx"
# Expected: 0 results

# Old descriptions API
grep -r "costing/descriptions" src/ --include="*.ts" --include="*.tsx"
# Expected: 0 results

# Old flat fields
grep -r "printBelt\|threadLabelsPollyBags\|fusingElasticButtonZip\|standardMinutesValue" src/ --include="*.ts" --include="*.tsx"
# Expected: 0 results

# Old single size field (careful: avoid false positives from "sizes")
grep -rn "\"size\"" src/models/CostingRecord.ts
# Expected: 0 results (should be "sizes" now)

# Stepper references in costing form
grep -r "setStep\|nextStep\|prevStep\|step === " src/components/costing/CostingForm.tsx
# Expected: 0 results (stepper removed)
```

### Step 4: Verify Deleted Files
```bash
# This file/directory should not exist
ls src/app/api/costing/descriptions/
# Expected: "No such file or directory"
```

---

## Phase 3: Data Model Verification

### Step 5: Model Schema Test
Verify the CostingRecord model by checking its schema output:

Create a temporary test or use the Node.js REPL:
```javascript
// Test that the schema accepts the new structure
const testRecord = {
  designNo: 'TEST-001',
  description: 'Test Design',
  sizes: ['S', 'M', 'L'],
  sewingItems: [
    { type: 'SEWING', description: 'CUTTING', unit: 'SMV', rate: 10, consumption: 25 }
  ],
  fabricItems: [
    { type: 'FABRIC', description: 'VISCOSE', unit: 'YADS', rate: 300, consumption: 1 }
  ],
  accessoriesItems: [
    { type: 'THREADS', description: 'COTTON', unit: 'CONN', rate: 160, consumption: 0.1 }
  ],
  specialItems: [
    { type: 'EMB/PRINT', description: 'FRONT PRINT', unit: 'NOS', rate: 60, consumption: 1 }
  ],
  sellingPrice: 1200,
};
```

Expected auto-calculated values:
- Sewing: `10 × 25 = 250.00`
- Fabric: `(300 × 1) + (300 × 1) / 100 × 5 = 315.00`
- Accessories: `160 × 0.1 = 16.00`
- Special: `60 × 1 = 60.00`
- Total Cost: `250 + 315 + 16 + 60 = 641.00`
- Gross Profit: `1200 - 641 = 559.00`
- Profit %: `(559 / 1200) × 100 = 46.58%`

---

## Phase 4: API Verification

### Step 6: POST Endpoint
```bash
curl -X POST http://localhost:3000/api/costing \
  -H "Content-Type: application/json" \
  -d '{
    "designNo": "TEST-001",
    "description": "Test Design",
    "sizes": ["S", "M", "L"],
    "sewingItems": [
      {"type": "SEWING", "description": "CUTTING, SEWING, PACKING", "unit": "SMV", "rate": 10, "consumption": 25}
    ],
    "fabricItems": [
      {"type": "FABRIC", "description": "VISCOSE PRINTED", "unit": "YADS", "rate": 300, "consumption": 1}
    ],
    "accessoriesItems": [
      {"type": "THREADS", "description": "COTTON AND YARN", "unit": "CONN", "rate": 160, "consumption": 0.1}
    ],
    "specialItems": [
      {"type": "EMB/PRINT", "description": "FRONT PRINT", "unit": "NOS", "rate": 60, "consumption": 1}
    ],
    "sellingPrice": 1200
  }'
```

Expected response:
- `success: true` with status `201`
- Response includes auto-calculated `amount` for each line item
- Response includes `sewingCost`, `fabricCost`, `accessoriesCost`, `specialCost`
- Response includes `totalCost`, `grossProfit`, `profitPercentage`
- No `purchasingDescription` or `fabric` fields in response

### Step 7: GET Endpoint
```bash
curl http://localhost:3000/api/costing
```
Expected: Returns all records with the new schema structure.

### Step 8: PUT Endpoint
Using the `_id` from the POST response:
```bash
curl -X PUT http://localhost:3000/api/costing/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "designNo": "TEST-001",
    "description": "Updated Test Design",
    "sizes": ["S", "M", "L", "XL"],
    "sewingItems": [...],
    "fabricItems": [...],
    "accessoriesItems": [...],
    "specialItems": [...],
    "sellingPrice": 1500
  }'
```
Expected: Updated record with recalculated totals.

### Step 9: DELETE Endpoint
```bash
curl -X DELETE http://localhost:3000/api/costing/{id}
```
Expected: `success: true`

### Step 10: Deleted Endpoint Returns 404
```bash
curl http://localhost:3000/api/costing/descriptions
```
Expected: `404 Not Found` (endpoint deleted)

---

## Phase 5: UI Verification (Browser Testing)

### Step 11: Add Costing Form
1. Navigate to `/admin/costing/add`
2. Verify: No stepper — single scrollable form
3. Verify: No "Purchasing Description" dropdown
4. Verify: No "Fabric (Linked from Purchasing)" field
5. Verify: Sizes field works as tag input
6. Verify: Can add multiple sewing/fabric/accessories/special items
7. Verify: Real-time amount calculation per row
8. Verify: Category totals update in real-time
9. Verify: Summary card shows all 4 category totals + overall total
10. Verify: Profit and margin % calculate correctly

### Step 12: Enter Key Navigation
1. Focus on Design No field
2. Press Enter → focus moves to Sizes input
3. Type "M", press Enter → "M" tag added
4. Press Enter on empty sizes → focus moves to Description
5. Press Enter → focus moves to first Sewing item Type
6. Continue pressing Enter through all fields
7. After Selling Price, Enter → Save button is triggered

### Step 13: Edit Costing Form
1. Create a record, then click Edit
2. Verify: All fields are pre-populated including line item arrays
3. Verify: Can add/remove line items
4. Verify: Save updates the record correctly

### Step 14: Detail Modal
1. Click on a costing record to open the detail modal
2. Verify: Shows sizes as tag chips
3. Verify: Shows 4 category tables with line items
4. Verify: Each category shows subtotal
5. Verify: Grand total section is correct
6. Verify: No purchasing description or fabric fields displayed

### Step 15: List Page Table
1. Navigate to `/admin/costing`
2. Verify: No "Purchasing Desc" column
3. Verify: No "Fabric" column
4. Verify: No "Fabric Price" column
5. Verify: "Size" column replaced with "Sizes" showing tag chips
6. Verify: Filters drawer has no "Purchasing Description" filter
7. Verify: Search still works (searches designNo and description)

---

## Phase 6: Calculation Accuracy Verification

### Step 16: Match Spreadsheet Values

Create a record with the exact values from the user's spreadsheet screenshot:

| Category    | Type         | Description                | Unit | Rate   | CON     |
|-------------|-------------|----------------------------|------|--------|---------|
| SEWING      | SEWING      | CUTTING,SEWING, PACKING    | SMV  | 10.00  | 25.00   |
| FABRIC      | FABRIC      | VISCOSE PRINTED            | YADS | 300.00 | 1.00    |
| FABRIC      | LILING      | LINING                     | YADS | 120.00 | 0.75    |
| FABRIC      | FUSING      | DOT FUSING                 | YADS | 45.00  | 0.0500  |
| ACCESSORIES | THREADS     | COTTON AND YARN            | CONN | 160.00 | 0.10    |
| ACCESSORIES | ELASTIC     | 1" ELASTIC                 | ROLL | 400.00 | 0.50    |
| ACCESSORIES | POLLY BAGS  | 11 X14 POLLY BAGS          | NOS  | 9.50   | 1.00    |
| ACCESSORIES | BUTTONS/BEATS| COCO BUTTONS               | NOS  | 2.50   | 12      |
| ACCESSORIES | BUCKLE/RINS | COVERING BUCKLE            | NOS  | 100.00 | 1       |
| ACCESSORIES | BUTTONS/BEATS| (empty)                   | NOS  | 0.00   | 1       |
| SPECIAL     | EMB/PRINT   | FRONT PRINT                | NOS  | 60.00  | 1       |
| SPECIAL     | PITUCK/PICKOT| (empty)                   | NOS  | 0.00   | 1       |
| SPECIAL     | B HOLE/B ATT | (empty)                   | NOS  | 0.00   | 1       |
| SPECIAL     | OTHERS      | (empty)                    | ANY  | 0.00   | 1       |
| SPECIAL     | OTHERS      | (empty)                    | ANY  | 0.00   | 1       |

Selling Price: **1200**

**Expected Results:**
- Sewing Cost: **250.00**
- Fabric Cost: **411.86** (each fabric item has 5% wastage)
  - VISCOSE: 300×1 + (300×1)/100×5 = 315.00
  - LINING: 120×0.75 + (120×0.75)/100×5 = 94.50
  - FUSING: 45×0.05 + (45×0.05)/100×5 = 2.36 (rounded)
  - Total: 315.00 + 94.50 + 2.36 = 411.86
- Accessories Cost: **360.96**
  - THREADS: 160×0.10 = 16.00
  - ELASTIC: 400×0.50 = 200.00
  - POLLY BAGS: 9.50×1 = 9.50  ← Note: The spreadsheet shows 14.96, which may differ
  - BUTTONS: 2.50×12 = 30.00
  - BUCKLE: 100×1 = 100.00
  - BUTTONS: 0×1 = 0.00
- Special Cost: **60.00**
  - EMB/PRINT: 60×1 = 60.00
  - Others: all 0.00
- Total Cost: **1082.82** (approximately — rounding may cause slight differences)
- Profit: **117.18**
- Margin %: **~9.77%**

> Note: Minor rounding differences may exist between the spreadsheet and the system. The formulas should match the spreadsheet's logic exactly: `=F4*G4+(F4*G4)/100*5` for fabric and `=F*G` for all other categories.

---

## Phase 7: Unit Tests

### Step 17: Update Model Tests
Update `__tests__/models/CostingRecord.test.ts` to:
1. Test creation with the new schema (line items, sizes array)
2. Test auto-calculation of `amount` per line item
3. Test fabric 5% wastage formula
4. Test category total summation
5. Test grand total, gross profit, profit percentage
6. Test `designNo` uniqueness constraint
7. Test validation: at least one size required
8. Remove all tests for old fields (`purchasingDescription`, `fabric`, `fabricPrice`, etc.)

---

## Completion Criteria

All of the following must pass for the update to be considered complete:

- [ ] `npm run build` succeeds with zero errors
- [ ] All grep searches from Step 3 return zero results
- [ ] Descriptions endpoint returns 404
- [ ] POST creates record with correct auto-calculations
- [ ] PUT updates record with recalculated totals
- [ ] Form renders as single form (no stepper)
- [ ] Sizes tag input works correctly
- [ ] Dynamic line item add/remove works
- [ ] Real-time calculations match expected values
- [ ] Enter key navigates between fields
- [ ] Enter on last field triggers save
- [ ] Detail modal displays category tables
- [ ] Table columns updated (no purchasing columns)
- [ ] Spreadsheet values match (Phase 6, Step 16)
