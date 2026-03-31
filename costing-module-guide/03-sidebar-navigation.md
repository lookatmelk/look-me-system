# 03 — Sidebar Navigation

> **File to modify:** `src/components/Sidebar.tsx`  
> **Current state:** "Costing" is in the `inactiveTabs` array with a lock icon (Coming Soon)

---

## What to Change

### Step 1: Move "Costing" from `inactiveTabs` to `navigation`

**Remove from `inactiveTabs` (line ~36):**
```diff
 const inactiveTabs = [
   { name: "Orders", icon: FileText },
-  { name: "Costing", icon: CircleDollarSign },
   { name: "Shop 1", icon: Store },
   { name: "Shop 2", icon: Store },
   { name: "Shop 3", icon: Store },
   { name: "Summary", icon: BarChart3 },
 ];
```

**Add to `navigation` (line ~24):**
```diff
 const navigation = [
   { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
   { name: "Purchasing", href: "/admin/purchasing", icon: ShoppingCart },
+  { name: "Costing", href: "/admin/costing", icon: CircleDollarSign },
 ];
```

---

### Step 2: Render Costing as a Simple Nav Link

Since Costing doesn't need sub-navigation (unlike Purchasing which has Category and Supplier), it should render as a **simple link** — the same way Dashboard renders. No expandable sub-menu is needed.

The existing `navigation.map(...)` logic already handles non-purchasing items as simple links (see lines 218-256 of the current Sidebar.tsx). Because the `isPurchasingParent` check is specific to `/admin/purchasing`, the new Costing entry will automatically fall through to the simple link rendering.

**Active state check will work automatically:**
```typescript
// This existing logic (line 122-124) will match Costing correctly:
const isActive = pathname === item.href || 
  (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
// For "/admin/costing" → true when pathname starts with "/admin/costing"
```

---

### Step 3: Update the Active Section Detection

The existing `isPurchasingSection` detection does not need to change because Costing has its own distinct route prefix (`/admin/costing`). No conflict with the purchasing sub-navigation.

---

## Visual Style (Matches Existing)

The Costing link should look identical to the Dashboard link:

- **Inactive state:** `text-slate-400`, hover → `text-white`, `bg-white/[0.07]`
- **Active state:** Green gradient background with green accent bar on the left
  ```css
  background: linear-gradient(135deg, rgba(22,163,74,0.22) 0%, rgba(22,163,74,0.10) 100%);
  border: 1px solid rgba(22,163,74,0.25);
  ```
- **Active icon:** `text-green-400`
- **Active text:** `text-white`, `font-semibold`

---

## Expected Sidebar Layout After Change

```
╔══════════════════════════════╗
║  @ LOOK@ME                   ║
╠══════════════════════════════╣
║  NAVIGATION                  ║
║  ┌─────────────────────────┐ ║
║  │ 🏠 Dashboard            │ ║
║  └─────────────────────────┘ ║
║  ┌─────────────────────────┐ ║
║  │ 🛒 Purchasing        ▼  │ ║
║  │   ├── Category           │ ║
║  │   └── Supplier           │ ║
║  └─────────────────────────┘ ║
║  ┌─────────────────────────┐ ║
║  │ 💰 Costing              │ ║   ← NEW ACTIVE LINK
║  └─────────────────────────┘ ║
║                              ║
║  COMING SOON                 ║
║  🔒 Orders                   ║
║  🔒 Shop 1                   ║
║  🔒 Shop 2                   ║
║  🔒 Shop 3                   ║
║  🔒 Summary                  ║
╠══════════════════════════════╣
║  👤 Admin                    ║
║  admin@lookatme.com          ║
╚══════════════════════════════╝
```

---

## TopHeader Breadcrumb Update

**File to modify:** `src/components/TopHeader.tsx`

Add "costing" to the `crumbMap` (line ~11):

```diff
 const crumbMap: Record<string, string> = {
   admin: "Admin",
   dashboard: "Dashboard",
   purchasing: "Purchasing",
   suppliers: "Suppliers",
   categories: "Categories",
+  costing: "Costing",
   add: "Add New",
   edit: "Edit",
 };
```

This ensures the breadcrumb reads `Admin / Costing` when on the costing page.

---

## No Other Changes Needed

- The `CircleDollarSign` icon is already imported in the Sidebar component
- The admin layout (`src/app/admin/layout.tsx`) doesn't need changes — it renders `{children}` for all `/admin/*` routes
- The middleware (`src/middleware.ts`) protects all `/admin/*` routes already

---

> **Next:** [04-costing-page.md](./04-costing-page.md)
