#!/bin/bash

#  ================================================================= |
#  ----------- joinMovies script to join two mp4 movies              |
#  ----------- next to each other or on top of each other            |
#  ----------- created by Matej Forman matej.forman@gmail.com        |
#  ----------- under the GPL 3                                       |
#  ================================================================= |



# Check if correct number of arguments provided
if [ $# -ne 4 ]; then
    echo "Usage: $0 <video1> <video2> <layout> <output>"
    echo ""
    echo "Layout options:"
    echo "  horizontal or h  - Videos side by side (video1 | video2)"
    echo "  vertical or v    - Videos stacked (video1 on top, video2 below)"
    echo ""
    echo "Example:"
    echo "  $0 video1.mp4 video2.mp4 horizontal output.mp4"
    echo "  $0 video1.mp4 video2.mp4 v output.mp4"
    exit 1
fi

VIDEO1=$1
VIDEO2=$2
LAYOUT=$3
OUTPUT=$4

# Check if input files exist
if [ ! -f "$VIDEO1" ]; then
    echo "Error: Video file '$VIDEO1' not found"
    exit 1
fi

if [ ! -f "$VIDEO2" ]; then
    echo "Error: Video file '$VIDEO2' not found"
    exit 1
fi

echo "Input 1: $VIDEO1"
echo "Input 2: $VIDEO2"
echo "Layout: $LAYOUT"
echo "Output: $OUTPUT"
echo ""

# Determine layout and run ffmpeg accordingly
case "$LAYOUT" in
    horizontal|h|H)
        echo "Creating horizontal layout (side by side)..."
        ffmpeg -i "$VIDEO1" -i "$VIDEO2" \
            -filter_complex "[0:v]scale=iw:ih[v0]; [1:v]scale=iw:ih[v1]; [v0][v1]hstack=inputs=2[v]" \
            -map "[v]" \
            -c:v libx264 -profile:v high -level 4.0 \
            -pix_fmt yuv420p -crf 18 -movflags +faststart \
            "$OUTPUT"
        ;;

    vertical|v|V)
        echo "Creating vertical layout (stacked)..."
        ffmpeg -i "$VIDEO1" -i "$VIDEO2" \
            -filter_complex "[0:v]scale=iw:ih[v0]; [1:v]scale=iw:ih[v1]; [v0][v1]vstack=inputs=2[v]" \
            -map "[v]" \
            -c:v libx264 -profile:v high -level 4.0 \
            -pix_fmt yuv420p -crf 18 -movflags +faststart \
            "$OUTPUT"
        ;;

    *)
        echo "Error: Invalid layout option '$LAYOUT'"
        echo "Use 'horizontal', 'h', 'vertical', or 'v'"
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo ""
    echo "Combined video created successfully: $OUTPUT"
else
    echo ""
    echo "Error creating combined video"
    exit 1
fi
