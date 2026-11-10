/* Glossary popups: edit the text here. Keys match data-g="..." attributes in index.html.
   h = heading, p = paragraphs (HTML allowed), l = optional links. */
(function(){
'use strict';
const DOC='https://doc.openfoam.com/2606/';
const NS=DOC+'tools/processing/numerics/';
const L=(t,u)=>({t,u});
const FVS=L('fvSchemes',DOC+'fundamentals/case-structure/fvschemes');
const FVL=L('fvSolution',DOC+'fundamentals/case-structure/fvsolution');
const G={
pressureeq:{h:'Pressure equation',p:['Taking the divergence of the momentum equation and using ∇·U = 0 gives a Poisson-type equation for p. Its solution is the pressure whose gradient makes the corrected velocity conservative, i.e. face fluxes sum to zero in every cell.','It is symmetric and elliptic: information travels everywhere at once, which is why this is usually the stiffest linear system and the natural customer for multigrid (GAMG).']},
fvm:{h:'fvm:: implicit',p:['Terms written with <code>fvm::</code> are discretised into matrix coefficients and solved for. Implicit treatment is more stable and allows larger time steps or relaxation factors.']},
fvc:{h:'fvc:: explicit',p:['Terms written with <code>fvc::</code> are evaluated numerically from current field values and returned as a field. In an equation they end up on the right-hand side.']},
gauss:{h:'Gauss (divergence) theorem',p:['The integral of a divergence over a volume equals the net flux through its bounding surface. It converts <i>volume integrals of derivatives</i> into <i>sums over faces</i>, which is what makes the method conservative.'],l:[L('Gradient schemes',NS+'schemes/gradient/')]},
collocated:{h:'Collocated arrangement',p:['All variables (U, p, k, …) are stored at the same points, the cell centres. It needs care in the pressure–velocity coupling (Rhie–Chow-type interpolation) to avoid checkerboard pressure, which OpenFOAM handles inside its solvers.']},
scheme:{h:'Discretisation scheme',p:['A recipe for turning a continuous operator into face sums using only cell values. Each operator has its own entry in <code>fvSchemes</code>.'],l:[FVS,L('Schemes overview',NS+'schemes/')]},
upwind:{h:'upwind',p:['Face value = value in the cell the flow comes from. Bounded and robust, first-order accurate. Its leading error acts like added diffusion of size uΔx/2.'],l:[L('upwind',NS+'schemes/divergence/rtm/upwind/')]},
linear:{h:'linear (central differencing)',p:['Face value = distance-weighted average of the two neighbouring cells. Second-order accurate on smooth fields, but not bounded: it can produce over- and undershoots when convection dominates (cell Péclet > 2).'],l:[L('linear',NS+'schemes/divergence/rtm/linear/')]},
linearUpwind:{h:'linearUpwind',p:['Upwind cell value extrapolated to the face with that cell\'s gradient. Second-order, not strictly bounded but far better behaved than central differencing. Needs a gradient scheme, e.g. <code>linearUpwind grad(U)</code>.'],l:[L('linearUpwind',NS+'schemes/divergence/rtm/linearUpwind/')]},
peclet:{h:'Péclet number',p:['Ratio of convective to diffusive transport, Pe = uL/Γ. Built with the cell size, Pe<sub>Δ</sub> = uΔx/Γ, it tells you how convection-dominated a single cell is.']},
smoothSolver:{h:'smoothSolver',p:['Repeats a smoother (GaussSeidel, symGaussSeidel, DILU…) until the residual criteria are met. Works for symmetric and asymmetric matrices. Often adequate for U, k, epsilon, where the matrix is diagonally dominant; weak for the pressure equation on fine meshes.'],l:[L('smooth solvers',NS+'solvers/smooth/'),FVL]},
pcg:{h:'PCG / DICPCG',p:['Preconditioned conjugate gradient for symmetric matrices. DIC (diagonal incomplete Cholesky) is the preconditioner. For asymmetric matrices use PBiCGStab instead.'],l:[L('CG solvers',NS+'solvers/cg/')]},
gamg:{h:'GAMG',p:['Geometric-algebraic multigrid. Builds a hierarchy of coarser systems by agglomerating cells, smooths on each level and corrects the fine solution from coarse ones. Iteration counts depend only weakly on mesh size. Typical choice for the pressure equation.','Keys: <code>smoother</code>, <code>nCellsInCoarsestLevel</code>, <code>agglomerator</code>, <code>cacheAgglomeration</code>.'],l:[L('multigrid',NS+'solvers/multigrid/')]},
ddtSchemes:{h:'ddtSchemes',p:['Time discretisation of ∂/∂t: <code>steadyState</code>, <code>Euler</code>, <code>backward</code>, <code>CrankNicolson</code>…'],l:[FVS]},
steadyState:{h:'steadyState',p:['Drops the time derivative. The iteration then converges towards the steady solution and "time" is only an iteration counter.']},
gradSchemes:{h:'gradSchemes',p:['How ∇φ is computed from cell values, e.g. <code>Gauss linear</code>, <code>leastSquares</code>, optionally limited. Used for fvc::grad and inside other schemes (e.g. linearUpwind).'],l:[L('Gradient schemes',NS+'schemes/gradient/'),FVS]},
Gauss:{h:'Gauss',p:['Finite-volume Gauss integration: the sum of face values times face area vectors. The standard choice for divergence and laplacian terms. For gradients, <code>leastSquares</code> is a common alternative.']},
divSchemes:{h:'divSchemes',p:['Convection terms ∇·(φU). There is one entry per term, named after the flux and the transported field, e.g. <code>div(phi,U)</code>. With <code>default none</code> OpenFOAM forces you to specify each, which avoids silent defaults.'],l:[L('Divergence schemes',NS+'schemes/'),FVS]},
bounded:{h:'bounded',p:['For steady runs: subtracts the ∇·U part (<code>Sp(div(phi))</code>) so that the discrete convection operator stays bounded even before the flux is divergence-free.']},
laplacianSchemes:{h:'laplacianSchemes',p:['Diffusion terms ∇·(Γ∇φ): the interpolation of Γ (<code>linear</code>) and the face-normal gradient scheme (<code>corrected</code>).'],l:[L('Laplacian schemes',NS+'schemes/laplacian/'),FVS]},
corrected:{h:'corrected',p:['Face-normal gradient with an explicit non-orthogonality correction. Needed on meshes where the line joining cell centres is not perpendicular to the face.']},
interpolationSchemes:{h:'interpolationSchemes',p:['General cell-to-face interpolation for quantities not covered by other entries.'],l:[FVS]},
snGradSchemes:{h:'snGradSchemes',p:['Surface-normal gradient on faces, used by laplacians and some boundary conditions.'],l:[FVS]},
solvers:{h:'solvers',p:['One sub-dictionary per field (regex allowed, e.g. <code>"(U|k|epsilon)"</code>). It sets the linear solver, smoother, tolerance and relative tolerance for that field\'s matrix.'],l:[FVL,L('Linear solvers',NS+'solvers/')]},
gaussSeidel:{h:'GaussSeidel',p:['Smoother that updates cells in order using latest neighbour values. <code>symGaussSeidel</code> sweeps forward then backward and is the common choice in smoothSolver.']},
tolerance:{h:'tolerance',p:['Absolute stop criterion for the (normalised) residual of one linear solve.']},
relTol:{h:'relTol',p:['Relative stop criterion: stop when the residual has fallen to this fraction of its initial value. In steady runs 0.1 is usual (no need to solve each outer iteration accurately). In transient runs it is often 0 for the final corrector.'],l:[L('residuals',NS+'solvers/residuals/')]},
SIMPLE:{h:'SIMPLE dictionary',p:['Controls of the SIMPLE pressure–velocity algorithm: non-orthogonal correctors, <code>consistent</code> (SIMPLEC), residual control. PIMPLE and PISO have analogous dictionaries for transient solvers.'],l:[FVL]},
consistent:{h:'consistent',p:['Switches SIMPLE to SIMPLEC, which usually allows higher relaxation factors.']},
relaxationFactors:{h:'relaxationFactors',p:['Under-relaxation of fields or equations. Slows each outer iteration down so that the non-linear coupling converges instead of oscillating.'],l:[L('under-relaxation',NS+'solvers/under-relaxation/'),FVL]}
};
window.GLOSSARY=G;
})();
