#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
input="${1:-/Users/lu/Desktop/01ea90455678084a01037003a04415d32d_259.mp4}"
mkdir -p public/media output/media-frames
if [ ! -f public/media/interview.mp4 ]; then cp "$input" public/media/interview.mp4; fi
i=0
for seconds in 110 260 785 1220 1810 2170 3090 3900; do
  ffmpeg -hide_banner -loglevel error -y -ss "$seconds" -i "$input" -frames:v 1 -vf 'scale=512:288' "output/media-frames/frame-$i.jpg"
  i=$((i+1))
done
ffmpeg -hide_banner -loglevel error -y -i output/media-frames/frame-%d.jpg -vf 'tile=4x2' -frames:v 1 -q:v 2 public/media/chapter-atlas.jpg
