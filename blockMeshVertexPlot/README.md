# blockMeshDict Vertex Visualizer

Interactive 3D visualization tool for OpenFOAM `blockMeshDict` files. Displays vertex positions with their indices and automatically detects duplicate vertices.

![Python Version](https://img.shields.io/badge/python-3.6%2B-blue)

## Features

- **Interactive 3D Visualization** - Rotate, pan, and zoom to inspect vertex geometry
- **Vertex Labeling** - Clear labels showing vertex indices
- **Duplicate Detection** - Automatically identifies and highlights duplicate vertices
- **Multiple Output Formats** - VTK for ParaView, PNG for static images, interactive matplotlib viewer
- **Simple Python** - No VTK dependency required for interactive viewer

## Installation

### Requirements

```bash
pip install numpy matplotlib
```

### Optional (for VTK output)

```bash
pip install vtk
```

## Usage

### Interactive Viewer (Recommended)

```bash
python3 blockMeshPlot.py blockMeshDict
```

**Controls:**
- **Left Mouse:** Rotate view
- **Right Mouse:** Zoom in/out
- **Middle Mouse:** Pan
- **Close Window:** Quit


## Examples

### Basic Usage

```bash
# Visualize cavity tutorial case
python3 blockMeshPlot.py $FOAM_TUTORIALS/incompressible/icoFoam/cavity/cavity/system/blockMeshDict

# Your own case
python3 blockMeshPlot.py system/blockMeshDict
```

### Output

The script provides detailed information about your mesh vertices:

```
Found 16 vertices
First few vertices parsed:
  Vertex 0: [-400. -170. -800.]
  Vertex 1: [ 400. -170. -800.]
  Vertex 2: [ 400.  500. -800.]
  ...

======================================================================
DUPLICATE VERTEX CHECK
======================================================================

⚠️  WARNING: Duplicate vertices at location:
   Coordinates: (-400.000000, -170.000000, -800.000000)
   Vertex indices: [0, 12]
   Number of duplicates: 2

======================================================================
⚠️  DUPLICATE VERTICES DETECTED!
This may indicate a problem in your blockMeshDict.
Duplicates will be shown in RED labels in the visualization.
======================================================================
```

## Scripts Overview

### `blockMeshPlot.py`

**Best for:** Quick interactive inspection of vertex numbering and geometry

- Uses matplotlib (no VTK required)
- Interactive 3D window with mouse controls
- Automatic duplicate vertex detection and highlighting
- Color-coded labels:
  - **Blue boxes**: Unique vertices
  - **Red boxes**: Duplicate vertices (multiple indices shown)

### Duplicate Vertices

**Why duplicates occur:**
- Copy-paste errors in blockMeshDict
- Attempting to share vertices between non-adjacent blocks
- Mistakes when manually editing vertex coordinates

**What to do:**
1. Review the warning output
2. Check your blockMeshDict for redundant vertex definitions
3. Use `mergePatchPairs` if you're intentionally connecting separate blocks
4. Consider if you can reduce the total vertex count

## Supported Formats

### blockMeshDict Vertex Format

```cpp
vertices
(
    (0 0 0)           // Vertex 0
    (1 0 0)           // Vertex 1
    (1 1 0)           // Vertex 2
    // ... more vertices
);
```

The parser supports:
- Standard decimal notation: `1.5`
- Scientific notation: `1.5e-3`
- C++ style comments: `//` and `/* */`
- Whitespace variations



## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

Matej Forman

