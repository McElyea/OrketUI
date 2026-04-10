# Design System: The Flow Architect’s Atelier

## 1. Overview & Creative North Star
**Creative North Star: "The Modern Archivist"**
This design system moves away from the frantic, neon-lit aesthetics of typical SaaS dashboards and toward the deliberate, calm atmosphere of a high-end editorial workspace. It is a digital atelier for systems thinking. 

We break the "template" look by treating the interface as a series of parchment-like layers. Rather than boxing users in with rigid grids, we use **intentional asymmetry** and **generous white space** to guide the eye. The experience should feel like a custom-bound ledger: authoritative, inspectable, and premium. We lean into the tension between a sharp, intellectual serif and a functional, high-performance sans-serif to create a sense of heritage meeting modern logic.

---

## 2. Colors
The palette is rooted in organic, earthy tones that reduce eye strain and promote deep work.

*   **Primary (#004532):** Our Deep Emerald. Used sparingly for high-intent actions and active states. It represents the "growth" of a system.
*   **Surface & Background:** We avoid pure white. The **Background (#fbf9f5)** is a warm cream, while **Surface-Container-Lowest (#ffffff)** acts as the "paper" for active work areas.
*   **Accents:** Tertiary Ambers and Rusts are used for system feedback, kept muted to maintain the "Calm Workspace" tone.

### The "No-Line" Rule
To achieve a premium editorial feel, designers are prohibited from using standard 1px solid borders for general sectioning. Boundaries must be defined through **Background Color Shifts**. For example, a `surface-container-low` side panel should sit flush against a `surface` canvas. The "line" is created by the change in tone, not a drawn stroke.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of parchment. 
1.  **Level 0 (The Desk):** `surface` (#fbf9f5).
2.  **Level 1 (The Folder):** `surface-container-low` (#f5f3ef).
3.  **Level 2 (The Paper):** `surface-container-highest` (#e4e2de).
Inner containers should use a slightly higher or lower tier to define importance, creating a "nested" depth that feels structural rather than decorative.

---

## 3. Typography
Our typography is the primary driver of the "Editorial" feel. It balances the intellectual (Serif) with the industrial (Sans).

*   **Display & Headlines (Newsreader):** A sharp, sophisticated serif. Use `display-lg` and `headline-md` to introduce major sections. These should feel like book titles—grand and authoritative.
*   **Titles & UI (Manrope):** A clean, geometric sans-serif. Used for headers within panels and navigation. It provides the "modern" bridge.
*   **Data & Labels (Inter):** High-legibility sans-serif for the smallest details. Use `label-md` for metadata and dense table content to ensure "inspectability."

**Hierarchy Note:** Use high-contrast scale jumps. A `display-lg` header next to a `body-sm` metadata tag creates a signature, high-end look that standard "uniform" scales lack.

---

## 4. Elevation & Depth
We eschew the "plastic" look of standard shadows for **Tonal Layering**.

*   **The Layering Principle:** Depth is achieved by stacking the `surface-container` tiers. A `surface-container-lowest` card placed on a `surface-container-low` section provides a soft, natural lift.
*   **Ambient Shadows:** If an element must float (e.g., a context menu), use an extra-diffused shadow. 
    *   *Spec:* `0px 12px 32px rgba(27, 28, 26, 0.06)`. The shadow is tinted with the `on-surface` color to mimic natural light.
*   **The "Ghost Border":** Where containment is required (e.g., input fields), use the `outline-variant` token at **20% opacity**. Never use 100% opaque, high-contrast borders.
*   **Glassmorphism:** For overlays, use a `surface` color with 80% opacity and a `12px backdrop-blur`. This allows the "system flows" beneath to subtly bleed through, keeping the user grounded in their workspace.

---

## 5. Components

### Buttons
*   **Primary:** Solid `primary` (#004532) with `on-primary` (#ffffff) text. Use `roundness-sm` (2px) for a sharp, architectural look.
*   **Secondary:** `surface-container-highest` background with `primary` text. No border.
*   **Tertiary:** Text-only, using `primary` color. High-emphasis hover state with a subtle `surface-tint` underline.

### Input Fields
*   **Styling:** Ghost borders only. Use a slightly darker background (`surface-container-high`) for the input area.
*   **States:** On focus, the background shifts to `surface-container-lowest` and the Ghost Border becomes a 1px `primary` stroke.

### Lists & Tables
*   **Rule:** Forbid divider lines. 
*   **Structure:** Use the Spacing Scale (generous vertical padding) to separate rows. In dense data tables, use alternating row fills of `surface-container-low` and `surface` to maintain readability without visual clutter.

### Flow Nodes (Signature Component)
As a flow-authoring tool, nodes should feel like "cards on a desk."
*   **Base:** `surface-container-lowest`.
*   **Header:** `headline-sm` (Newsreader) to make the node's purpose feel significant.
*   **Connection Points:** Minimalist Emerald dots that only appear on hover or when an "Active Link" state is triggered.

---

## 6. Do's and Don'ts

### Do
*   **Do** use extreme whitespace. If a section feels crowded, double the padding.
*   **Do** use asymmetrical layouts. A side panel doesn't always have to match the width of the opposing content.
*   **Do** prioritize typography over icons. Let the words carry the weight.

### Don't
*   **Don't** use pure black (#000000). Use `on-surface` (#1b1c1a) for text to maintain the warm, organic feel.
*   **Don't** use standard "drop shadows" on cards. Rely on color shifts first.
*   **Don't** use rounded corners above 4px for primary UI elements. Sharp edges convey precision and professional "inspectability."