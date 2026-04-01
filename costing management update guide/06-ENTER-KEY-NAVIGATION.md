# Guide 06 — Enter Key Navigation

## File to Modify

`src/components/costing/CostingForm.tsx` (as part of the rewrite from Guide 03)

## Requirement

1. Pressing `Enter` on any input field moves focus to the **next** input field in the form
2. Pressing `Enter` on the **last** input field triggers the save/submit button
3. Navigation must flow logically through the form: top-to-bottom, left-to-right
4. This must work with the dynamic line item rows (field arrays can have variable lengths)

---

## Implementation Strategy

### Approach: Ref Array with Dynamic Registration

Since the form has a **dynamic number of fields** (line items can be added/removed), use a `useRef` to store a flat array of all focusable input references, dynamically updated as the form renders.

### Step 1: Create Ref Collection

```typescript
const inputRefs = useRef<(HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null)[]>([]);
const submitBtnRef = useRef<HTMLButtonElement>(null);
```

### Step 2: Create a Registration Helper

Create a function that assigns a ref to an input and tracks its position:

```typescript
let refIndex = 0; // Reset at the beginning of each render

// Call this to reset the counter before rendering
const resetRefIndex = () => { refIndex = 0; };

// Call this in each input's ref prop
const registerRef = (el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null) => {
  if (el) {
    inputRefs.current[refIndex] = el;
    refIndex++;
  }
};
```

**Important**: `refIndex` must be reset at the start of each render cycle. Use a pattern like:

```typescript
// Inside the component's render (before the return statement):
let currentRefIdx = 0;

const getRef = (el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null) => {
  if (el) {
    inputRefs.current[currentRefIdx] = el;
  }
  currentRefIdx++;
};
```

### Step 3: Form-Level onKeyDown Handler

Add a `onKeyDown` handler to the `<form>` element:

```typescript
const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
  if (e.key !== 'Enter') return;

  const target = e.target as HTMLElement;
  
  // Only handle Enter on input elements (not buttons, not textareas for multi-line)
  if (
    !(target instanceof HTMLInputElement) &&
    !(target instanceof HTMLSelectElement)
  ) {
    return;
  }

  e.preventDefault(); // Prevent default form submission

  // Find the current element's index in our ref array
  const currentIndex = inputRefs.current.findIndex(ref => ref === target);

  if (currentIndex === -1) return;

  // Move to next field
  const nextIndex = currentIndex + 1;

  if (nextIndex < inputRefs.current.length && inputRefs.current[nextIndex]) {
    // Focus the next field
    const nextElement = inputRefs.current[nextIndex];
    if (nextElement) {
      nextElement.focus();
      // If it's a text/number input, select all text for easy overwriting
      if (nextElement instanceof HTMLInputElement) {
        nextElement.select();
      }
    }
  } else {
    // We're on the last field — trigger the save button
    if (submitBtnRef.current) {
      submitBtnRef.current.focus();
      submitBtnRef.current.click();
    }
  }
};
```

### Step 4: Apply to the Form Element

```tsx
<form
  onSubmit={handleSubmit(handleFormSubmit)}
  onKeyDown={handleFormKeyDown}
>
```

### Step 5: Register Every Input Field

Every `<input>`, `<select>`, and interactive element in the form must use the `getRef` function in combination with react-hook-form's `register()`.

Since `register()` returns its own `ref`, you need to merge them:

```tsx
// Helper to merge react-hook-form's register ref with our navigation ref
const mergeRefs = (registerResult: any) => {
  const { ref: registerRef, ...rest } = registerResult;
  return {
    ...rest,
    ref: (el: HTMLInputElement | null) => {
      registerRef(el);  // react-hook-form's ref
      getRef(el);        // our navigation ref
    },
  };
};
```

#### Usage in inputs:

```tsx
{/* Design No */}
<input
  type="text"
  {...mergeRefs(register('designNo'))}
  placeholder="e.g. 1009"
  className={inputClass(!!errors.designNo)}
/>

{/* Sizes tag input — the text input part */}
<input
  type="text"
  ref={(el) => { getRef(el); sizeInputRef.current = el; }}
  placeholder="Type a size and press Enter"
  className={inputClass(false)}
  onKeyDown={handleSizeKeyDown}  // Special handling for sizes (see below)
/>

{/* Sewing Items — each field in each row */}
{sewingFields.map((field, index) => (
  <div key={field.id}>
    <input {...mergeRefs(register(`sewingItems.${index}.type`))} />
    <input {...mergeRefs(register(`sewingItems.${index}.description`))} />
    <input {...mergeRefs(register(`sewingItems.${index}.unit`))} />
    <input {...mergeRefs(register(`sewingItems.${index}.rate`, { valueAsNumber: true }))} />
    <input {...mergeRefs(register(`sewingItems.${index}.consumption`, { valueAsNumber: true }))} />
  </div>
))}

{/* ... same pattern for fabricItems, accessoriesItems, specialItems ... */}

{/* Selling Price — the last actual input */}
<input {...mergeRefs(register('sellingPrice', { valueAsNumber: true }))} />
```

### Step 6: Submit Button Ref

```tsx
<Button
  type="submit"
  ref={submitBtnRef}
  isLoading={isLoading}
  className="..."
>
  {isLoading ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Record')}
</Button>
```

---

## Field Navigation Order

The Enter key must traverse fields in this exact logical order:

```
1.  Design No
2.  [Sizes text input — special handling, see below]
3.  Description
4.  Sewing Item 1: Type → Description → Unit → Rate → CON
5.  Sewing Item 2: Type → Description → Unit → Rate → CON  (if exists)
6.  ... (more sewing items)
7.  Fabric Item 1: Type → Description → Unit → Rate → CON
8.  ... (more fabric items)
9.  Accessories Item 1: Type → Description → Unit → Rate → CON
10. ... (more accessories items)
11. Special Item 1: Type → Description → Unit → Rate → CON
12. ... (more special items)
13. Selling Price
14. [Enter here → triggers Save button]
```

---

## Special Handling: Sizes Input

The sizes field uses a **tag input** pattern. The Enter key behavior here is different:
- Pressing Enter should **add the current tag** (not navigate to the next field)
- The sizes input needs its **own** `onKeyDown` handler that:
  1. Prevents the form-level Enter handler from firing (`e.stopPropagation()`)
  2. Takes the current input value, adds it to the `sizes` array
  3. Clears the input
  4. Only navigates to the next field if the input is empty when Enter is pressed

```typescript
const handleSizeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    e.stopPropagation(); // Prevent form-level handler

    const value = e.currentTarget.value.trim().toUpperCase();
    
    if (value === '') {
      // Empty input + Enter → move to next field (Description)
      // Find the next ref and focus it
      const currentIndex = inputRefs.current.findIndex(ref => ref === e.currentTarget);
      if (currentIndex !== -1 && currentIndex + 1 < inputRefs.current.length) {
        inputRefs.current[currentIndex + 1]?.focus();
      }
      return;
    }

    const currentSizes = getValues('sizes') || [];
    
    if (!currentSizes.includes(value)) {
      setValue('sizes', [...currentSizes, value], { shouldValidate: true });
    }
    
    e.currentTarget.value = '';
  }
  
  // Backspace on empty input → remove last size tag
  if (e.key === 'Backspace' && e.currentTarget.value === '') {
    const currentSizes = getValues('sizes') || [];
    if (currentSizes.length > 0) {
      setValue('sizes', currentSizes.slice(0, -1), { shouldValidate: true });
    }
  }
};
```

---

## Edge Cases

### 1. Dynamic Row Addition
When a new row is added via "Add Row", the ref array will be rebuilt on the next render. The new row fields will automatically be included in the navigation order.

### 2. Dynamic Row Removal
When a row is removed, the ref array shrinks accordingly on re-render. No special handling needed — the refs are re-registered on every render.

### 3. Read-Only / Display Fields
The "Amount" column for each line item is a read-only display. Do NOT include these in the ref array — they should not be focusable or part of the Enter navigation chain.

### 4. Select Elements
The `<select>` elements (if any remain, like unit dropdowns) should also be included in the Enter navigation. When focused by the Enter handler, the select will open on a subsequent Enter press (default browser behavior).

### 5. Number Inputs — Auto-Select
When navigating to a number input, call `.select()` to select all text so the user can immediately start typing a new value without manually clearing.

---

## Testing the Navigation

After implementation, verify:
1. Press Tab to focus the first field (Design No)
2. Press Enter — cursor moves to the sizes input
3. Type "M" and press Enter — "M" is added as a tag, input clears, cursor stays in sizes input
4. Press Enter on empty sizes input — cursor moves to Description
5. Press Enter — cursor moves to first Sewing item Type
6. Continue pressing Enter through all fields in the sewing row
7. After the last sewing item field, Enter moves to the first fabric item field
8. Continue through all categories
9. After Selling Price, Enter triggers the save button
10. Add a new row in any category, verify the new fields are included in the navigation order
