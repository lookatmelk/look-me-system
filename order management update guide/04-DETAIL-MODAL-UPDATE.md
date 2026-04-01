# Guide 04 — OrderDetailModal Update

## File to Modify

`src/components/orders/OrderDetailModal.tsx`

---

## Objective

Update the detail modal to:
1. Display the new `sampleNo` field
2. Fix any references to the old `size` field from costing
3. Ensure correct rendering of `sizes` (array) if referenced

---

## Current State

The current `OrderDetailModal` shows:
- Revenue Summary Hero (designTotal, projectedRevenue, projectedProfit)
- Order Information (designNo, description, orderDate, status)
- Shop Allocations breakdown
- Costing Information (sellingPrice, totalCost, profit per unit, profitPercentage)
- Notes

**Missing**: `sampleNo` is not displayed.

---

## Changes Required

### 1. Add `sampleNo` to Order Information Section

In the "Order Information" section (the grid with `DetailField` components), add a `sampleNo` field after `designNo`:

```diff
 <div className="grid grid-cols-2 gap-x-6 gap-y-4">
   <DetailField icon={<Hash className="h-3.5 w-3.5" />} label="Design No" value={record.designNo} />
+  <DetailField icon={<Hash className="h-3.5 w-3.5" />} label="Sample No" value={record.sampleNo || '—'} />
   <DetailField icon={<Package className="h-3.5 w-3.5" />} label="Description" value={record.description} />
   <DetailField icon={<Calendar className="h-3.5 w-3.5" />} label="Order Date" value={...} />
   <DetailField icon={<FileText className="h-3.5 w-3.5" />} label="Status" value={...} />
 </div>
```

This changes the grid from 4 fields (2×2) to 5 fields (3 on first row, 2 on second). Since it's a `grid-cols-2` layout, this will naturally wrap.

### 2. Update Modal Title to Include Sample No (If Present)

Update the modal title to optionally show the sample number:

```diff
 <Modal
   isOpen
   onClose={onClose}
-  title={`Order — Design #${record.designNo}`}
+  title={`Order — Design #${record.designNo}${record.sampleNo ? ` / Sample #${record.sampleNo}` : ''}`}
   subtitle={record.description}
   size="lg"
 >
```

### 3. No Other Changes Needed

The rest of the modal is fine:
- Shop allocations use `record.shopAllocations` which is from the order model (unchanged)
- Costing information uses `record.sellingPrice`, `record.totalCost`, `record.profitPercentage` which are denormalized on the order (unchanged)
- The shop color logic uses `alloc.shopId?.color` from the populated shop reference (unchanged)

---

## Complete Diff

```diff
 return (
   <Modal
     isOpen
     onClose={onClose}
-    title={`Order — Design #${record.designNo}`}
+    title={`Order — Design #${record.designNo}${record.sampleNo ? ` / Sample #${record.sampleNo}` : ''}`}
     subtitle={record.description}
     size="lg"
   >
     {/* ... Revenue Summary Hero unchanged ... */}
     
     {/* Order Information */}
     <div className="px-6 py-5 border-b border-slate-100">
       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Order Information</p>
       <div className="grid grid-cols-2 gap-x-6 gap-y-4">
         <DetailField icon={<Hash className="h-3.5 w-3.5" />} label="Design No" value={record.designNo} />
+        <DetailField icon={<Hash className="h-3.5 w-3.5" />} label="Sample No" value={record.sampleNo || '—'} />
         <DetailField icon={<Package className="h-3.5 w-3.5" />} label="Description" value={record.description} />
         <DetailField icon={<Calendar className="h-3.5 w-3.5" />} label="Order Date" value={
           record.orderDate ? format(new Date(record.orderDate), 'dd MMM yyyy') : '—'
         } />
         <DetailField icon={<FileText className="h-3.5 w-3.5" />} label="Status" value={
           <span className={clsx(
             'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border',
             statusStyles[record.status] || 'bg-slate-100 text-slate-500'
           )}>
             {displayLabels[record.status] || record.status}
           </span>
         } />
       </div>
     </div>
```

---

## Verification

After making these changes:
1. Opening the detail modal for an order with `sampleNo` should display it in the title and the info grid.
2. Opening the detail modal for an order without `sampleNo` should show `'—'` as the value and not affect the title.
3. All other sections (revenue, shop allocations, costing, notes) should render unchanged.
