
## makeMovie.sh 

script is using ffmpeg to generate a mp4 movie from the set of png files called:

***basename.XXXX.png***

Movie is Powerpoint friendly. 

ffmpeg parameters used are: 
- framerate 24 - 24 fps (adjust to your preference: 30, 60, etc.)
- i isoQ.%04d.png - Input pattern (matches isoQ.0001.png, isoQ.0002.png, etc.)
- c:v libx264 - H.264 codec (universally compatible)
- profile:v high -level 4.0 - Compatibility profile for PowerPoint
- pix_fmt yuv420p - Pixel format that PowerPoint requires
- crf 18 - Quality (18 = high quality, range 0-51, lower = better)
- movflags +faststart - Optimizes for streaming/quick playback

Use: makeMovie.sh \<name\>     \<outputName\>.mp4


## joinMovies.sh
script to combine two videos side-by-side or stacked:

```
./combine_videos.sh video1.mp4 video2.mp4 vertical output.mp4
./combine_videos.sh video1.mp4 video2.mp4 v output.mp4
```

