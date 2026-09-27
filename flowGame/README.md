# foamFun — a birthday case

A tiny CFD game in the browser. Each term of the momentum equation has a control, and the flow below reacts live.

**Play:** https://matejForman.github.io/flowGame/

Five cases named after OpenFOAM tutorials: pipeBucket, pitzDaily, cylinder, hotRoom and autumn.
The solver is Stam's Stable Fluids with BFECC advection and a Jacobi pressure projection on a 176×88 grid;
the "How it works" tab in the game explains the method and what is faked.

URL options: `?name=Someone` personalises the final screen, `?leaves=N` sets the number of leaves (5–150).

Single self-contained `index.html`, no build step.
