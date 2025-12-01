#!/usr/bin/env python3
"""
OpenFOAM Residual Plot Script
Extracts residuals from OpenFOAM log file and generates a plot using gnuplot
Live monitoring mode with auto-refresh

Created by Matej Forman
matej.forman@gmail.com
"""

import re
import subprocess
import sys
import time
import os
from collections import defaultdict

def parse_log_file(filename):
    """Parse OpenFOAM log file and extract residuals"""
    
    time_steps = []
    residuals = defaultdict(list)
    current_time = None
    temp_residuals = {}
    
    with open(filename, 'r') as f:
        for line in f:
            # Check for time step
            time_match = re.match(r'^Time = (.+)$', line.strip())
            if time_match:
                # Save previous timestep data if it exists
                if current_time is not None and temp_residuals:
                    time_steps.append(current_time)
                    for var, res in temp_residuals.items():
                        residuals[var].append(res)
                
                current_time = float(time_match.group(1))
                temp_residuals = {}
                continue
            
            # Check for solver residuals
            # Pattern: any preconditioner followed by solver name (PCG, PBiCGStab, PBiCG, GAMG)
            # or just solver name (smoothSolver, diagonal)
            solver_match = re.match(
                r'^\s*(\w*)(PCG|PBiCGStab|PBiCG|GAMG|smoothSolver|diagonal):\s+Solving for (\w+),.*Initial residual = ([0-9.e+-]+)',
                line
            )
            
            if solver_match:
                preconditioner = solver_match.group(1)  # Could be empty, DILU, etc.
                solver_type = solver_match.group(2)     # PCG, GAMG, etc.
                variable = solver_match.group(3)
                initial_residual = float(solver_match.group(4))
                
                # Skip 'rho' and 'diagonal' solver entries
                if variable == 'rho' or solver_type == 'diagonal':
                    continue
                
                # Store the residual (will overwrite previous ones for same variable)
                temp_residuals[variable] = initial_residual
    
    # Don't forget the last timestep
    if current_time is not None and temp_residuals:
        time_steps.append(current_time)
        for var, res in temp_residuals.items():
            residuals[var].append(res)
    
    return time_steps, residuals

def write_gnuplot_script(time_steps, residuals, output_file='residuals.png', live_mode=False, work_dir='.'):
    """Generate gnuplot script and data file"""
    
    # Filter out ILambda_ variables (radiation residuals)
    filtered_residuals = {k: v for k, v in residuals.items() if not k.startswith('ILambda_')}
    
    # Write data file in the working directory
    data_filename = os.path.join(work_dir, 'residuals.dat')
    variables = sorted(filtered_residuals.keys())
    
    with open(data_filename, 'w') as f:
        # Header
        f.write('# Time ' + ' '.join(variables) + '\n')
        
        # Data
        for i, time in enumerate(time_steps):
            f.write(f'{time:.6e}')
            for var in variables:
                if i < len(filtered_residuals[var]):
                    f.write(f' {filtered_residuals[var][i]:.6e}')
                else:
                    f.write(' NaN')
            f.write('\n')
    
    # Write gnuplot script
    if live_mode:
        gnuplot_script = "set terminal qt size 1200,800 enhanced font 'Arial,12' title 'OpenFOAM Residuals'\n"
    else:
        gnuplot_script = f"set terminal pngcairo size 1200,800 enhanced font 'Arial,12'\nset output '{output_file}'\n"
    
    gnuplot_script += """set title 'OpenFOAM Initial Residuals vs Time' font 'Arial,14'
set xlabel 'Time [s]'
set ylabel 'Initial Residual'
set logscale y
set grid
set key outside right top

set style line 1 lt 1 lw 2 lc rgb '#e41a1c'
set style line 2 lt 1 lw 2 lc rgb '#377eb8'
set style line 3 lt 1 lw 2 lc rgb '#4daf4a'
set style line 4 lt 1 lw 2 lc rgb '#984ea3'
set style line 5 lt 1 lw 2 lc rgb '#ff7f00'
set style line 6 lt 1 lw 2 lc rgb '#ffff33'
set style line 7 lt 1 lw 2 lc rgb '#a65628'
set style line 8 lt 1 lw 2 lc rgb '#f781bf'

plot """
    
    # Always use lines (no points) for both modes
    plot_style = 'lines'
    
    plot_commands = []
    for i, var in enumerate(variables, start=1):
        col = i + 1
        line_style = ((i - 1) % 8) + 1
        plot_commands.append(f"'{data_filename}' using 1:{col} with {plot_style} ls {line_style} title '{var}'")
    
    gnuplot_script += ', \\\n    '.join(plot_commands) + '\n'
    
    script_filename = os.path.join(work_dir, 'plot_residuals.gp')
    with open(script_filename, 'w') as f:
        f.write(gnuplot_script)
    
    return script_filename

def live_monitor(log_file, refresh_interval=10):
    """Monitor log file and update plot in real-time"""
    
    # Get absolute path and working directory
    log_file = os.path.abspath(log_file)
    work_dir = os.path.dirname(log_file)
    
    print(f"Starting live monitoring of: {log_file}")
    print(f"Working directory: {work_dir}")
    print(f"Refresh interval: {refresh_interval} seconds")
    print("Press Ctrl+C to stop monitoring\n")
    
    gnuplot_process = None
    last_size = 0
    first_plot = True
    
    try:
        while True:
            # Check if file has been modified
            current_size = os.path.getsize(log_file)
            
            if current_size != last_size:
                print(f"[{time.strftime('%H:%M:%S')}] Log file updated, refreshing plot...")
                
                # Parse log file
                time_steps, residuals = parse_log_file(log_file)
                
                if time_steps:
                    print(f"  Time steps: {len(time_steps)}, Variables: {', '.join(sorted(residuals.keys()))}")
                    
                    # Generate gnuplot script
                    script_file = write_gnuplot_script(time_steps, residuals, live_mode=True, work_dir=work_dir)
                    
                    if first_plot:
                        # Start gnuplot process for the first time
                        gnuplot_process = subprocess.Popen(
                            ['gnuplot', '-persist'],
                            stdin=subprocess.PIPE,
                            text=True
                        )
                        first_plot = False
                    
                    # Send replot command to gnuplot
                    if gnuplot_process and gnuplot_process.poll() is None:
                        with open(script_file, 'r') as f:
                            gnuplot_commands = f.read()
                        gnuplot_process.stdin.write(gnuplot_commands + '\n')
                        gnuplot_process.stdin.flush()
                    else:
                        # If process died, restart it
                        print("  Restarting gnuplot process...")
                        gnuplot_process = subprocess.Popen(
                            ['gnuplot', '-persist'],
                            stdin=subprocess.PIPE,
                            text=True
                        )
                        with open(script_file, 'r') as f:
                            gnuplot_commands = f.read()
                        gnuplot_process.stdin.write(gnuplot_commands + '\n')
                        gnuplot_process.stdin.flush()
                    
                    last_size = current_size
                else:
                    print("  No data found yet...")
            
            # Wait before next check
            time.sleep(refresh_interval)
            
    except KeyboardInterrupt:
        print("\n\nStopping live monitoring...")
        if gnuplot_process is not None:
            gnuplot_process.stdin.close()
            gnuplot_process.terminate()
            gnuplot_process.wait()
        print("Plot window will remain open. Close it manually when done.")
    except Exception as e:
        print(f"\nError: {e}")
        if gnuplot_process is not None:
            gnuplot_process.stdin.close()
            gnuplot_process.terminate()
            gnuplot_process.wait()

def main():
    """Main function"""
    
    if len(sys.argv) < 2:
        print("Usage: openfoam_residual_plot.py <logfile> [--live] [--interval SECONDS]")
        print("\nExamples:")
        print("  plotResidualFromLog.py log.txt                    # Generate PNG file")
        print("  plotResidualFromLog.py log.txt --live             # Live monitoring (10s refresh)")
        print("  plotResidualFromLog.py log.txt --live --interval 5  # Live monitoring (5s refresh)")
        sys.exit(1)
    
    log_file = sys.argv[1]
    
    # Convert to absolute path
    if not os.path.isabs(log_file):
        log_file = os.path.abspath(log_file)
    
    if not os.path.exists(log_file):
        print(f"Error: Log file not found: {log_file}")
        sys.exit(1)
    
    live_mode = '--live' in sys.argv
    
    # Get refresh interval
    refresh_interval = 10
    if '--interval' in sys.argv:
        try:
            idx = sys.argv.index('--interval')
            refresh_interval = int(sys.argv[idx + 1])
        except (IndexError, ValueError):
            print("Error: --interval requires a number (seconds)")
            sys.exit(1)
    
    if live_mode:
        # Live monitoring mode
        live_monitor(log_file, refresh_interval)
    else:
        # Single plot generation mode
        work_dir = os.path.dirname(log_file)
        output_file = os.path.join(work_dir, 'residuals.png')
        
        print(f"Parsing log file: {log_file}")
        time_steps, residuals = parse_log_file(log_file)
        
        if not time_steps:
            print("Error: No time steps found in log file")
            sys.exit(1)
        
        print(f"Found {len(time_steps)} time steps")
        print(f"Variables found: {', '.join(sorted(residuals.keys()))}")
        
        print("Generating gnuplot script...")
        script_file = write_gnuplot_script(time_steps, residuals, output_file, live_mode=False, work_dir=work_dir)
        
        print(f"Running gnuplot...")
        try:
            subprocess.run(['gnuplot', script_file], check=True)
            print(f"Plot generated: {output_file}")
        except FileNotFoundError:
            print("Error: gnuplot not found. Please install gnuplot.")
            print("Data file 'residuals.dat' and script 'plot_residuals.gp' have been created.")
            print("You can run: gnuplot plot_residuals.gp")
            sys.exit(1)
        except subprocess.CalledProcessError as e:
            print(f"Error running gnuplot: {e}")
            sys.exit(1)

if __name__ == '__main__':
    main()
