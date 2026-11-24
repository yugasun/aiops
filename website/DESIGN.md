# Design for aiops

`src/tokens.css` adapts the production site’s dark blue and cyan palette for the bilingual aiops site. The homepage opens with a copyable IDE command. Workflow phases are shown alongside the use cases.

## System

- Genre: modern-minimal.
- Palette: near-black canvas, blue-tinted panels, and a subtle blue grid behind the homepage hero.
- Text: bundled Geist for headings and interface text.
- Code: JetBrains Mono for commands, paths, and measured figures.
- Signal: blue marks primary actions and active navigation, cyan marks interface details, green marks the IDE command, and amber marks final approval.

## Layout

- The landing page opens with a centered headline, concise feature descriptions, and a compact terminal. Installation is the first section after the hero.
- The seven execution stages run across the use case on wide screens and stack on narrow screens.
- Documentation uses a sticky navigation panel and a tinted page heading. Small screens use the document drawer.
- Examples put prompts alongside their stages on wide screens. Delivery checks and documentation links use compact panels.
- The resume example compares the initial prompt and resumed session side by side on wide screens and in reading order on phones.
- On phones, artifact rows show each filename with its producer and consumers. Benchmark rows put the metric on its own line and keep both fixture values side by side.

## Controls

- Blue fill for the primary action. Secondary actions use outlined dark-blue surfaces.
- Focus is visible immediately. The hero command reports clipboard success or failure and stays selectable.
- The grid and background glow are static. System reduced-motion preferences take precedence over interaction transitions.

## Source

`src/index.css` maps system roles to the existing Tailwind and Base UI classes. `src/base.css` sets the responsive scale, reading defaults, and focus treatment.
