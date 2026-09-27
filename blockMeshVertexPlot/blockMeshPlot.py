#!/usr/bin/env python3
"""
Interactive matplotlib viewer for blockMeshDict vertices with labels.
Uses matplotlib's built-in 3D interaction (no VTK required).

"""

import re
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D


def parse_blockmesh_dict(filename):
    """Parse blockMeshDict file and extract vertex coordinates."""
    with open(filename, 'r') as f:
        content = f.read()
    
    # Remove C++ style comments
    content = re.sub(r'//.*', '', content)
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    
    # Find the vertices section
    vertices_match = re.search(r'vertices\s*\((.*?)\);', content, re.DOTALL)
    
    if not vertices_match:
        raise ValueError("Could not find 'vertices' section in blockMeshDict")
    
    vertices_text = vertices_match.group(1)
    
    # Extract coordinate triplets
    coord_pattern = r'\(\s*([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)\s*\)'
    
    matches = re.findall(coord_pattern, vertices_text)
    
    if not matches:
        raise ValueError("Could not parse vertex coordinates")
    
    vertices = np.array([[float(x), float(y), float(z)] for x, y, z in matches])
    
    print(f"Found {len(vertices)} vertices")
    print("First few vertices parsed:")
    for i in range(min(5, len(vertices))):
        print(f"  Vertex {i}: {vertices[i]}")
    
    return vertices


def create_interactive_viewer(vertices):
    """
    Create an interactive matplotlib 3D viewer with vertex labels.
    
    Controls:
    - Left mouse: Rotate
    - Right mouse: Zoom
    - Middle mouse: Pan
    - Close window to quit
    """
    fig = plt.figure(figsize=(14, 10))
    ax = fig.add_subplot(111, projection='3d')
    
    # Plot vertices as spheres
    ax.scatter(vertices[:, 0], vertices[:, 1], vertices[:, 2], 
               c='red', marker='o', s=200, alpha=0.7, 
               edgecolors='darkred', linewidths=2)
    
    # Calculate label offset based on data range
    data_range = vertices.max(axis=0) - vertices.min(axis=0)
    offset = data_range.max() * 0.03  # 3% of range
    
    # Detect duplicate vertices and group them
    from collections import defaultdict
    vertex_groups = defaultdict(list)
    tolerance = 1e-6
    
    for i in range(len(vertices)):
        vertex_key = tuple(np.round(vertices[i] / tolerance) * tolerance)
        vertex_groups[vertex_key].append(i)
    
    # Report duplicates before visualization
    duplicates_found = False
    print("\n" + "="*70)
    print("DUPLICATE VERTEX CHECK")
    print("="*70)
    
    for vertex_key, indices in vertex_groups.items():
        if len(indices) > 1:
            duplicates_found = True
            vertex = vertices[indices[0]]
            print(f"\n⚠️  WARNING: Duplicate vertices at location:")
            print(f"   Coordinates: ({vertex[0]:.6f}, {vertex[1]:.6f}, {vertex[2]:.6f})")
            print(f"   Vertex indices: {indices}")
            print(f"   Number of duplicates: {len(indices)}")
    
    if not duplicates_found:
        print("\n✓ No duplicate vertices found - mesh topology is clean!")
    else:
        print("\n" + "="*70)
        print("⚠️  DUPLICATE VERTICES DETECTED!")
        print("This may indicate a problem in your blockMeshDict.")
        print("Duplicates will be shown in RED labels in the visualization.")
        print("="*70)
    
    print()
    
    # Add vertex labels - stack duplicates
    for vertex_key, indices in vertex_groups.items():
        if len(indices) > 1:
            # Multiple vertices at same location - stack labels
            vertex = vertices[indices[0]]
            label_text = ','.join(map(str, indices))
            ax.text(vertex[0] + offset, vertex[1] + offset, vertex[2] + offset, 
                    label_text, 
                    fontsize=14, weight='bold', color='red',
                    ha='left', va='bottom',
                    bbox=dict(boxstyle='round,pad=0.4', facecolor='yellow', 
                             edgecolor='red', alpha=0.95, linewidth=2),
                    zorder=1000)
        else:
            # Single vertex at this location
            i = indices[0]
            vertex = vertices[i]
            ax.text(vertex[0] + offset, vertex[1] + offset, vertex[2] + offset, 
                    f'{i}', 
                    fontsize=16, weight='bold', color='blue',
                    ha='left', va='bottom',
                    bbox=dict(boxstyle='round,pad=0.3', facecolor='yellow', 
                             edgecolor='blue', alpha=0.9, linewidth=2),
                    zorder=1000)
    
    # Set labels
    ax.set_xlabel('X', fontsize=14, weight='bold')
    ax.set_ylabel('Y', fontsize=14, weight='bold')
    ax.set_zlabel('Z', fontsize=14, weight='bold')
    ax.set_title('blockMeshDict Vertices - Interactive Viewer\n' +
                 'Left Mouse: Rotate | Right Mouse: Zoom | Middle Mouse: Pan',
                 fontsize=14, weight='bold', pad=20)
    
    # Make the panes slightly transparent
    ax.xaxis.pane.fill = False
    ax.yaxis.pane.fill = False
    ax.zaxis.pane.fill = False
    
    # Set pane colors
    ax.xaxis.pane.set_edgecolor('gray')
    ax.yaxis.pane.set_edgecolor('gray')
    ax.zaxis.pane.set_edgecolor('gray')
    
    # Add grid
    ax.grid(True, alpha=0.3, linestyle='--')
    
    # Set equal aspect ratio (approximate for 3D)
    max_range = np.array([
        vertices[:, 0].max() - vertices[:, 0].min(),
        vertices[:, 1].max() - vertices[:, 1].min(),
        vertices[:, 2].max() - vertices[:, 2].min()
    ]).max() / 2.0
    
    mid_x = (vertices[:, 0].max() + vertices[:, 0].min()) * 0.5
    mid_y = (vertices[:, 1].max() + vertices[:, 1].min()) * 0.5
    mid_z = (vertices[:, 2].max() + vertices[:, 2].min()) * 0.5
    
    ax.set_xlim(mid_x - max_range, mid_x + max_range)
    ax.set_ylim(mid_y - max_range, mid_y + max_range)
    ax.set_zlim(mid_z - max_range, mid_z + max_range)
    
    # Set initial view angle
    ax.view_init(elev=30, azim=45)
    
    # Print info
    print("\n=== Interactive Viewer Started ===")
    print("Controls:")
    print("  - Left mouse button: Rotate view")
    print("  - Right mouse button: Zoom in/out")
    print("  - Middle mouse button: Pan")
    print("  - Close window to quit")
    print("\nVertex coordinates:")
    for i, vertex in enumerate(vertices):
        print(f"  {i}: ({vertex[0]:.6f}, {vertex[1]:.6f}, {vertex[2]:.6f})")
    print("\nRotate the view to see all vertex labels clearly!")
    print()
    
    plt.tight_layout()
    plt.show()


def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Interactive matplotlib viewer for blockMeshDict vertices'
    )
    parser.add_argument('input', help='Path to blockMeshDict file')
    
    args = parser.parse_args()
    
    # Parse blockMeshDict
    try:
        vertices = parse_blockmesh_dict(args.input)
    except Exception as e:
        print(f"Error parsing blockMeshDict: {e}")
        return 1
    
    # Launch interactive viewer
    create_interactive_viewer(vertices)
    
    return 0


if __name__ == '__main__':
    import sys
    sys.exit(main())
