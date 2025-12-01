# OpenFOAM Residual Plot

A Python script for plotting OpenFOAM solver residuals with live monitoring capabilities.

## Features

-  **Automatic residual extraction** from OpenFOAM log files
-  **Live monitoring mode** with auto-refresh
-  **Logarithmic scale** for better visualization
-  **Color-coded lines** for different variables
-  **Smart filtering** - excludes radiation bands (ILambda_*) and zero residuals
-  **Dual output** - interactive Qt window or PNG file

## Requirements

- Python 3.x
- gnuplot with Qt terminal support

```bash
# Install gnuplot (macOS)
brew install gnuplot --with-qt

# Install gnuplot (Ubuntu/Debian)
sudo apt-get install gnuplot gnuplot-qt
```

## Installation

```bash
# Copy script to your bin directory
cp openfoam_residual_plot.py ~/bin/plotResidualFromLog.py 

# Make executable
chmod +x ~/bin/plotResidualFromLog.py 

# Ensure ~/bin is in PATH (add to ~/.bashrc or ~/.zshrc if needed)
export PATH="$HOME/bin:$PATH"
```

## Usage

### Generate static PNG plot
```bash
plotResidualFromLog.py  log.txt
```
Creates `residuals.png` in the same directory as the log file.

### Live monitoring (10 second refresh)
```bash
plotResidualFromLog.py log.txt --live
```

### Live monitoring with custom refresh interval
```bash
plotResidualFromLog.py log.txt --live --interval 5
```

### Stop live monitoring
Press `Ctrl+C` - the plot window will remain open.

## What it plots

The script automatically extracts initial residuals for all solved variables:
- **Velocity components**: Ux, Uy, Uz
- **Pressure**: p, p_rgh
- **Species**: O2, CO2, H2O, CH4, etc.
- **Scalars**: T, h, k, epsilon, omega, nuTilda
- **Volume fractions**: alpha.water, alpha.air
- **Any custom fields** you define

### Automatic filtering
-  Radiation bands (ILambda_*) - excluded
-  Density (rho) with zero residuals - excluded
-  Last residual per variable per timestep - plotted

## Supported solvers

Filters variables to plot using solver name in the log file:
- PCG, PBiCG, PBiCGStab
- GAMG
- smoothSolver
- Any preconditioner prefix (DILU, DIC, etc.)

## Output files

When running, the script creates in the log file directory:
- `residuals.dat` - extracted data
- `plot_residuals.gp` - gnuplot script
- `residuals.png` - plot image (static mode only)

## Example

```bash
# Start your OpenFOAM case
pimpleFoam > log.txt 2>&1 &

# Monitor residuals in real-time
openfoam_residual_plot log.txt --live --interval 10
```

## Tips

- Use live mode to monitor long-running simulations
- The Qt window allows zooming and panning
- Data files can be used for custom post-processing
- Works from any directory - outputs go to log file location

## Author

Matej Forman

