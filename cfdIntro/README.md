# Finite volume primer

Static page, no build step, no external requests except the documentation links.
Open `index.html` in a browser (double-click works, no server needed).

- `index.html`        all chapter text (one `<section>` per chapter)
- `css/style.css`     design tokens (`:root`) and layout; `css/fonts.css` self-hosted fonts
- `js/glossary.js`    popup explanations (keys match `data-g="..."` in index.html)
- `js/core.js`        popup logic, navigation, equation-term explanations, shared helpers
- `js/numerics.js`    all numerical code (duct, channel, convection-diffusion, matrix assembly,
                      Gauss-Seidel / CG / GAMG); pure functions, testable with Node
- `js/ch2-ch3-figures.js`, `js/ch4-solvers.js`, `js/sketches.js`   the figures
- `js/main.js`        initial drawing

Script order in index.html matters (numerics, glossary, core, figures, main last).
Keep quotes in JS strings escaped (\'): one stray apostrophe stops that file.
Fonts: IBM Plex Sans/Mono and STIX Two Text, SIL Open Font License 1.1.
