# 03 — Sidebar Navigation

> **File to modify:** `src/components/Sidebar.tsx`  
> **Current state:** "Orders" is in the `inactiveTabs` array with a lock icon (Coming Soon)

---

## What to Change

### Step 1: Move "Orders" from `inactiveTabs` to `navigation`

**Remove from `inactiveTabs` (line ~36):**
```diff
 const inactiveTabs = [
-  { name: "Orders", icon: FileText },
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
   { name: "Costing", href: "/admin/costing", icon: CircleDollarSign },
+  { name: "Orders", href: "/admin/orders", icon: FileText },
 ];
```

---

### Step 2: Render Orders as a Simple Nav Link

Since Orders doesn't need sub-navigation (unlike Purchasing which has Category and Supplier), it should render as a **simple link** — the same way Dashboard and Costing render. No expandable sub-menu is needed.

The existing `navigation.map(...)` logic already handles non-purchasing items as simple links. Because the `isPurchasingParent` check is specific to `/admin/purchasing`, the new Orders entry will automatically fall through to the simple link rendering.

**Active state check will work automatically:**
```typescript
// This existing logic will match Orders correctly:
const isActive = pathname === item.href || 
  (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
// For "/admin/orders" → true when pathname starts with "/admin/orders"
```

---

### Step 3: No Active Section Detection Changes Needed

The existing `isPurchasingSection` detection does not need to change because Orders has its own distinct route prefix (`/admin/orders`). No conflict with the purchasing sub-navigation.

---

## Visual Style (Matches Existing)

The Orders link should look identical to the Dashboard and Costing links:

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
║  │ 💰 Costing              │ ║
║  └─────────────────────────┘ ║
║  ┌─────────────────────────┐ ║
║  │ 📄 Orders               │ ║   ← NEW ACTIVE LINK
║  └─────────────────────────┘ ║
║                              ║
║  COMING SOON                 ║
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

Add `"orders"` to the `crumbMap` (line ~11 in the existing file):

```diff
 const crumbMap: Record<string, string> = {
   admin: "Admin",
   dashboard: "Dashboard",
   purchasing: "Purchasing",
   suppliers: "Suppliers",
   categories: "Categories",
   costing: "Costing",
+  orders: "Orders",
   add: "Add New",
   edit: "Edit",
 };
```

This ensures the breadcrumb reads `Admin / Orders` when on the orders page.

---

## No Other Changes Needed

- The `FileText` icon is already imported in the Sidebar component (line ~8 of current file)
- The admin layout (`src/app/admin/layout.tsx`) doesn't need changes — it renders `{children}` for all `/admin/*` routes
- The middleware (`src/middleware.ts`) protects all `/admin/*` routes already

---

> **Next:** [04-orders-page.md](./04-orders-page.md)
