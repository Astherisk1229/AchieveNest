# Phase 9 Evidence: OSAD Responsive Navigation Matrix

| Viewport Mode | Breakpoint / Dimension | Navigation Pattern | Trigger Mechanism | Active Route Indication | Group Headings | Focus & Keyboard Management | Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Desktop Expanded** | `>= 1024px` (`lg:`) | Sticky Left Sidebar (64px/256px) | Topbar Menu Toggle (collapse) | `aria-current="page"`, active emerald pill | Rendered uppercase tracking | Full Tab order | **PASS** |
| **Desktop Collapsed** | `>= 1024px` (`lg:`) | Hidden via Topbar Toggle (`lg:hidden`) | Topbar Menu Toggle (`aria-expanded`) | Restored on toggle expand | Restored on toggle expand | Topbar button focus | **PASS** |
| **Tablet** | `640px - 1023px` (`sm:` / `md:`) | Off-canvas Drawer with Backdrop | Topbar Hamburger Icon | `aria-current="page"`, active emerald pill | Rendered uppercase tracking | Escape listener, Backdrop click, close-on-nav | **PASS** |
| **Mobile** | `< 640px` | Off-canvas Drawer with Backdrop | Topbar Hamburger Icon | `aria-current="page"`, active emerald pill | Rendered uppercase tracking | Escape listener, Close button (`X`), close-on-nav | **PASS** |
