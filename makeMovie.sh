#!/bin/bash

#  ================================================================= |
#  ----------- makeMovie script to generate powerpoint friendly mp4  |
#  ----------- using ffmpeg                                          |
#  ----------- works with png files called <name>.XXXX.png           |
#  ----------- created by Matej Forman matej.forman@gmail.com        |
#  ----------- under the GPL 3                                       |
#  ================================================================= |

# Check if correct number of arguments provided
if [ $# -ne 2 ]; then
    echo "Usage: $0 <basename> <output_file>"
    echo "Example: $0 isoQ output.mp4"
    exit 1
fi

BASENAME=$1
OUTPUT=$2

# Find the first file to determine starting number
FIRST_FILE=$(ls ${BASENAME}.*.png 2>/dev/null | head -n 1)

if [ -z "$FIRST_FILE" ]; then
    echo "Error: No PNG files found matching pattern ${BASENAME}.*.png"
    exit 1
fi

# Extract the starting number from the first file
START_NUM=$(echo "$FIRST_FILE" | sed "s/${BASENAME}\.\([0-9]*\)\.png/\1/" | sed 's/^0*//')
if [ -z "$START_NUM" ]; then
    START_NUM=0
fi

# Determine the number of digits (padding) from the first file
PADDING=$(echo "$FIRST_FILE" | sed "s/${BASENAME}\.\([0-9]*\)\.png/\1/" | wc -c)
PADDING=$((PADDING - 1))

echo "Found files matching: ${BASENAME}.*.png"
echo "First file: $FIRST_FILE"
echo "Starting number: $START_NUM"
echo "Padding: $PADDING digits"

# Check image dimensions
echo "Checking image dimensions..."
ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$FIRST_FILE"

# Construct the input pattern with correct padding
INPUT_PATTERN="${BASENAME}.%0${PADDING}d.png"

echo "Output file: $OUTPUT"
echo "Running ffmpeg with pattern: $INPUT_PATTERN"
echo ""

# Run ffmpeg with dimension fix (scale to even dimensions if needed)
ffmpeg -framerate 24 -start_number $START_NUM -i "$INPUT_PATTERN" \
    -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" \
    -c:v libx264 -profile:v high -level 4.0 \
    -pix_fmt yuv420p -crf 18 -movflags +faststart \
    "$OUTPUT"

if [ $? -eq 0 ]; then
    echo ""
    echo "Video created successfully: $OUTPUT"
else
    echo ""
    echo "Error creating video"
    exit 1
fi
