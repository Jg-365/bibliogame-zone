# ACCESSIBILITY_AUDIT.md

> All findings are grounded in direct inspection of the repository.

---

## 1. WCAG 2.1 AA — Compliance Claim

The README badges "WCAG 2.1 AA Compliant" and the design system section describes comprehensive accessibility support. Actual implementation was evaluated by inspecting `src/shared/accessibility/`.

---

## 2. What Is Well Implemented

### ARIA Live Regions — `useAnnouncer()`

(`src/shared/accessibility/index.tsx`)

A proper `useAnnouncer` hook is implemented:

- Creates a visually hidden `div` (`sr-only`) with `aria-live="polite"` and `aria-atomic="true"` and `role="status"`
- Provides an `announce(message, priority)` function accepting `"polite"` or `"assertive"` urgency
- Clears announcement after 1 second to allow repeated identical messages
- Used in `App.tsx` via `AnnouncerComponent` mounted globally

This is a textbook implementation of screen reader announcements.

### Keyboard Navigation — `useKeyboardNavigation()`

A `useKeyboardNavigation` hook exists that:

- Queries focusable elements inside a container ref
- Provides `focusFirst()`, `focusLast()`, `focusNext()`, `focusPrev()` utilities
- Supports `loop` option for circular tab traversal

### Skip Links, Focus Indicators

- The `shared/accessibility/` module includes a `components.tsx` file (contents partially inspected). From the module index, skip link components and focus trap utilities are present.

### Radix UI Base Components

All shadcn/ui components are built on Radix UI, which provides:

- Native keyboard support for dialogs, dropdowns, tooltips, select menus
- Proper `aria-*` attributes managed automatically
- Focus trapping in modal dialogs

### Reduced Motion

`src/shared/accessibility/index.tsx` (400 lines, partially read) likely contains `prefers-reduced-motion` utilities given the module's scope. Confirmed: `framer-motion` respects `useReducedMotion()` when explicitly implemented — not confirmed whether this is applied to all animated components.

---

## 3. Potential Gaps

### Automated Testing Absent

`axe-core` and `jest-axe` are **not present** in `package.json`. The README claims "integration with jest-axe for CI/CD" — this is not confirmed from repository inspection. Without automated axe testing in CI, WCAG compliance regressions are caught only by manual testing.

### Color Contrast — Not Validated

The token system defines HSL values for colors but no tooling (e.g., Storybook a11y plugin, pa11y) validates contrast ratios programmatically. The `--secondary` token (`220 14.3% 95.9%` — very light gray) used as a background against `--foreground` text needs contrast verification.

### Form Accessibility

`react-hook-form` with Zod resolvers handles form state, but:

- Error messages must be associated to inputs via `aria-describedby` for screen readers
- This depends on individual component implementation and cannot be confirmed without component inspection

### Image Accessibility

Book cover images are loaded from Google Books CDN URLs. Alt text for these images must be set (book title) — not confirmed from component inspection.

### Motion

`framer-motion` is used for page transitions. If components do not call `useReducedMotion()` and conditionally disable animation, users with vestibular disorders will see motion even with the OS "Reduce Motion" preference enabled.

### Focus Management on Route Change

On SPA navigation, focus must be moved to the new page's main content area. The `AnnouncerComponent` announces navigation but actual focus placement on route change is not confirmed from `App.tsx` inspection.

---

## 4. Evaluation by WCAG Principle

| Principle                           | Implemented                                                                        | Gap                                      |
| ----------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------- |
| **Perceivable** — Alt text          | Partial (not confirmed for all images)                                             | Book covers need alt text                |
| **Perceivable** — Color contrast    | Partial (tokens defined, not validated)                                            | Automate contrast checks                 |
| **Perceivable** — Reduced motion    | Partial (framer-motion present but `useReducedMotion` not confirmed on all motion) | Audit animated components                |
| **Operable** — Keyboard navigation  | Well implemented (Radix UI + useKeyboardNavigation)                                | Form focus management needs verification |
| **Operable** — Focus management     | Partial (announcer present, route focus unclear)                                   | Confirm focus on route change            |
| **Understandable** — Error messages | Partial (Zod + react-hook-form present)                                            | aria-describedby wiring per input        |
| **Robust** — Valid HTML             | Likely good (React + Radix)                                                        | No automated validation confirmed        |
| **Robust** — ARIA implementation    | Strong (Radix UI manages ARIA)                                                     | Custom components need audit             |

---

## 5. Summary

The accessibility infrastructure is **above average for an MVP**. The `shared/accessibility/` module is more thorough than most projects at this stage. The main liability is the **absence of automated accessibility testing** (axe-core absent from dependencies), which means regressions are undetected until manual QA. The WCAG 2.1 AA badge in the README is aspirational rather than verified.
