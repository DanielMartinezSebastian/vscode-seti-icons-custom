# seti-icons

Icons for VS Code (version 1.5.0+)

## usage 

    ## Installation

    1. Open the Command Palette (Press `F1` or `Ctrl+Shift+P`)
    2. Type "File Icon Theme"
    3. Select `Seti UI` from the list

    ## Applying Changes After Installation

    1. In the project root directory, run:
        ```bash
        node lib/icon.js
        ```
    2. Open the Command Palette (Press `F1` or `Ctrl+Shift+P`)
    3. Select `Developer: Reload Window`

## screenshot

![screenshot](./screenshot.png)

## custom folder colors

We've customized the colors of common Next.js project folders for better visibility and organization, including `components`, `hooks` and `utils` directories.

Additionally, we've added darker color variants for the `.vscode` and `.next` folders to distinguish these system/build folders from your project source code.

![custom-folders](./next-folders.jpg)

## change log

- v0.1.4

 1. add custom colors for Next.js project folders (components, hooks, context, services and utils)
 2. add darker color variants for .vscode and .next folders

- v0.1.3

 1. add icons for files(gulpfile.ts, webpack.config.babel.js)

- v0.1.2

 1. add icons for files(yarn.lock, .flowconfig)

- v0.1.1

 1. add icons for files(.wxml, .wxss)

- v0.0.9

 1. add icons for folders(src)

 2. add icons for files(webpack.config.js, .vim)

- v0.0.8 

 1. add icons for folders(.vscode, typings, node_modules, .git)

 2. add icons for files(.pem, .key, .fs, .zip, .rar, .xcodeproj, .vue)