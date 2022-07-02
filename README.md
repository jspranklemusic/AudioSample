# AudioSample
A simple, vanilla JS in-browser DAW for editing, recording, and mixing. 

<img width=400 src="https://user-images.githubusercontent.com/75324120/176989391-3d5f13ba-3fb1-4153-8162-ab6b78a2e8e4.png"/>

### Development
This is a vanilla Javascript app that uses a custom Webpack config for ease of development and bundling. 
Before starting development, run `npm install`.
To start a dev server, `npm run start`. To create a build for production,  `npm run build`.
### About

This is currently in the *very early* stages, with most of the functionality still needing to be added, and much refactoring needing to be done. There is UI for other features, such as mute, solo, recording, and dragging clips across the timeline, but this is not functional yet.
Currently, the features that work are:

1. import multiple files
2. play them back all at once
3. remove clips from the timeline
4. move the cursor to a position and play at that location

For a while, there was an issue where it took a very long time to render the waveform, as well as the amount of tracks that could be rendered at once. Now, it can load about 50+ audio files in about under a minute.
