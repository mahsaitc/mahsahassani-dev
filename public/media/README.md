# Demo clips

Drop one short loop per project here, named after the project slug:

    rxclinic.mp4  inventrack.mp4  articleforge.mp4  taskflow.mp4  cartforge.mp4

Guidelines that keep the cards fast:

- 6-12 seconds, no audio track, H.264 MP4 (broadest support)
- 1280x800 or smaller, target under 2 MB each
- The cards never preload video; it is fetched on hover only
- If a file is missing the card silently falls back to its poster image

Suggested encode:

    ffmpeg -i raw.mov -t 10 -an -vf "scale=1280:-2,fps=24" \
           -c:v libx264 -crf 30 -preset slow -movflags +faststart rxclinic.mp4
