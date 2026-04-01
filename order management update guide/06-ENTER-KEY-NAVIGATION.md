# Guide 06 — Enter Key Navigation (Order Form)

## File

`src/components/orders/OrderForm.tsx` (as part of the rewrite from Guide 03)

---

## Requirement

1. Pressing `Enter` on any input field moves focus to the **next** input field in the form
2. Pressing `Enter` on the **last** input field triggers the save/submit button
3. Navigation must flow logically through the form: top-to-bottom, left-to-right
4. This must work with the dynamic shop allocation rows (field arrays can have variable lengths)

---

## Implementation Strategy

### Approach: Match CostingForm.tsx Pattern Exactly

The costing form already implements this pattern successfully. Copy the same approach:

### Step 1: Create Ref Collection

```typescript
const inputRefs = useRef<(HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null)[]>([]);
const submitBtnRef = useRef<HTMLButtonElement>(null);
```

### Step 2: Create Registration Helpers

```typescript
let refIndex = 0;

const getRef = (el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null) => {
  if (el) {
    inputRefs.current[refIndex] = el;
  }
  refIndex++;
};

const mergeRefs = (registerResult: any) => {
  const { ref: registerRef, ...rest } = registerResult;
  return {
    ...rest,
    ref: (el: HTMLInputElement | null) => {
      registerRef(el);
      getRef(el);
    },
  };
};
```

**Key**: `refIndex` is a `let` variable declared at the component's render scope (NOT inside `useRef`). It resets to 0 at the start of every render because the component re-executes.

### Step 3: Form-Level onKeyDown Handler

```typescript
const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
  if (e.key !== 'Enter') return;

  const target = e.target as HTMLElement;

  // Only handle Enter on input and select elements (NOT textarea)
  if (
    !(target instanceof HTMLInputElement) &&
    !(target instanceof HTMLSelectElement)
  ) {
    return;
  }

  e.preventDefault();

  const currentIndex = inputRefs.current.findIndex(ref => ref === target);
  if (currentIndex === -1) return;

  const nextIndex = currentIndex + 1;

  if (nextIndex < inputRefs.current.length && inputRefs.current[nextIndex]) {
    const nextElement = inputRefs.current[nextIndex];
    if (nextElement) {
      nextElement.focus();
      if (nextElement instanceof HTMLInputElement) {
        nextElement.select();
      }
    }
  } else {
    // Last field — trigger save
    if (submitBtnRef.current) {
      submitBtnRef.current.focus();
      submitBtnRef.current.click();
    }
  }
};
```

### Step 4: Apply to Form Element

```tsx
<form
  onSubmit={handleSubmit(onFormSubmit)}
  onKeyDown={handleFormKeyDown}
  className="p-6 sm:p-8 space-y-8"
>
```

### Step 5: Register All Input Fields

Every `<input>` and `<select>` in the form must use either `mergeRefs()` (for react-hook-form registered fields) or `ref={(el) => getRef(el)}` (for non-registered fields):

```tsx
{/* Design No — select dropdown */}
<select
  {...mergeRefs(register('costingId'))}
  onChange={(e) => handleDesignChange(e.target.value)}
  className={inputClass(!!errors.costingId)}
>

{/* Sample No — text input */}
<input
  type="text"
  {...mergeRefs(register('sampleNo'))}
  placeholder="e.g. SAMPLE-001"
  className={inputClass(!!errors.sampleNo)}
/>

{/* Order Date */}
<input
  type="date"
  {...mergeRefs(register('orderDate'))}
  className={inputClass(!!errors.orderDate)}
/>

{/* Status */}
<select
  {...mergeRefs(register('status'))}
  className={inputClass(!!errors.status)}
>

{/* Notes — textarea, NOT registered in refIndex */}
{/* The textarea is NOT part of Enter navigation */}
<textarea
  {...register('notes')}
  rows={3}
  placeholder="Any additional notes..."
  className={inputClass(!!errors.notes)}
/>

{/* Shop Allocation Quantity — for each row */}
{fields.map((field, index) => (
  <input
    type="number"
    min="0"
    step="1"
    {...mergeRefs(register(`shopAllocations.${index}.qty`, { valueAsNumber: true }))}
    className={...}
    placeholder="0"
  />
))}
```

### Step 6: Submit Button Ref

```tsx
<Button
  type="submit"
  ref={submitBtnRef}
  isLoading={isLoading || isSubmitting}
  disabled={isLoading || isSubmitting}
  className="gap-2 rounded-xl shadow-[0_4px_14px_rgba(22,163,74,0.28)] hover:shadow-[0_6px_20px_rgba(22,163,74,0.38)] bg-gradient-to-r from-green-600 to-green-500"
>
  {(isLoading || isSubmitting) ? (
    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</>
  ) : (
    <>{initialData ? "Update Order" : "Create Order"}</>
  )}
</Button>
```

---

## Field Navigation Order

The Enter key must traverse fields in this exact logical order:

```
1.  Design No (select dropdown — costingId)
2.  Sample No (text input)
3.  Order Date (date input)
4.  Status (select dropdown)
5.  [SKIP: Notes textarea — NOT part of Enter nav]
6.  Shop Allocation 1: Quantity (number input)
7.  Shop Allocation 2: Quantity (number input)  ... if exists
8.  Shop Allocation N: Quantity (number input)  ... if exists
9.  [Enter on last qty field → triggers Save button]
```

**Why skip Notes?**
- The `<textarea>` uses `Enter` for newlines. Including it in the Enter navigation would conflict with its normal behavior.
- The `handleFormKeyDown` handler already excludes `HTMLTextAreaElement` by only checking for `HTMLInputElement` and `HTMLSelectElement`.

**Why only quantity for shop allocations?**
- The size selectors are button-based chip toggles (`<button type="button">`), not input fields. They are clicked with a mouse/touch, not navigated with Enter.
- The shop selector dropdown at the top of the allocations section is also not part of the Enter chain — it's a UI control for adding shops, not a data-entry field.

---

## Dynamic Row Handling

### When a Shop is Added
When the user adds a new shop allocation, the new quantity input will be rendered. On the next render cycle, `refIndex` resets and all inputs are re-registered. The new input is automatically included in the navigation order.

### When a Shop is Removed
When the user removes a shop allocation, the quantity input is removed from the DOM. On re-render, the remaining inputs are re-registered, and the navigation order adjusts automatically.

### No Special Handling Needed
The ref-array approach naturally handles dynamic additions and removals because `refIndex` resets on every render.

---

## Edge Cases

### 1. Empty Shop Allocations
If no shop allocations exist yet, pressing Enter on the last metadata field (Status) will trigger the save button directly. This is correct behavior — the form validation will catch the missing allocations.

### 2. Select Elements
When a `<select>` receives focus via Enter navigation, the user can change the value with arrow keys and then press Enter to move to the next field.

### 3. Number Inputs — Auto-Select
When navigating to a number input, `.select()` is called to highlight the existing value. This allows the user to immediately type a new value without manually clearing the old one.

### 4. Date Input
The `<input type="date">` works with Enter navigation. When focused, the user can interact with the date picker and then press Enter to move on.

---

## Testing the Navigation

After implementation, verify:
1. Press Tab to focus the first field (Design No dropdown)
2. Select a design, press Enter — cursor moves to Sample No
3. Type a sample number, press Enter — cursor moves to Order Date
4. Press Enter — cursor moves to Status
5. Press Enter — (Notes is skipped) cursor moves to first shop allocation Quantity
6. Type a quantity, press Enter — cursor moves to next shop allocation Quantity
7. On the last shop allocation Quantity, press Enter — save button is triggered
8. Add a new shop allocation, verify its quantity field is included in the navigation order
9. Remove a shop allocation, verify navigation still flows correctly

---

## Reference

This implementation exactly mirrors the pattern in `src/components/costing/CostingForm.tsx` (lines 124–176). Refer to that file for the working implementation.
