# gnome-shell-extension-tilingnome

Tiling window manager

## Features

* Horizontal, vertical, spiral layouts
* Gaps
* (Experimental) Multi-monitor

## Installation

1) Clone the project to the gnome-shell extension directory:

```
git clone --depth=1 https://github.com/rliang/gnome-shell-extension-tilingnome ~/.local/share/gnome-shell/extensions/tilingnome@rliang.github.com
```

2) Reload GNOME Shell: `Alt+F2` then `r` or log out and in;

3) Enable the extension:

```
gnome-shell-extension-tool -e tilingnome@rliang.github.com
```

## Usage

Most of your interactions with Tilingnome will be through the use of keyboard shortcuts.
The available ones are listed below.

### Tiles

| Default keybinding       | Function            | Description                                         |
| ------------------------ | ------------------- | --------------------------------------------------- |
| Super+__x__              | Toggle tile         | Toggle whether to tile the currently-focused window |
| Super+__return__         | Focus first tile    | Focus the first tile in the tile list               |
| Super+__j__              | Focus next tile     | Focus the next tile in the tile list                |
| Super+__k__              | Focus previous tile | Focus the previous tile in the tile list            |
| _Shift_+Super+__return__ | Swap first tile     | Swap currently-focused tile with the first tile     |
| _Shift_+Super+__j__      | Swap next tile      | Swap currently-focused tile with the next tile      |
| _Shift_+Super+__k__      | Swap prev tile      | Swap currently-focused tile with the previous tile  |

### Layouts

| Default keybinding       | Function               | Description                                         |
| ------------------------ | ---------------------- | --------------------------------------------------- |
| Super+__z__              | Switch next layout     | Switch to the next available layout                 |
| _Shift_+Super+__z__      | Switch previous layout | Switch to the previous available layout             |

### Settings

| Default keybinding       | Function               | Description                                         |
| ------------------------ | ---------------------- | --------------------------------------------------- |
| Super+__u__              | Decrease split         | Decrease the split ratio by the split ratio step    |
| Super+__i__\*            | Increase split         | Increase the split ratio by the split ratio step    |
| _Shift_+Super+__u__      | Decrease master count  | Decreate the master count by one                    |
| _Shift_+Super+__i__      | Increase master count  | Increase the master count by one                    |

## Recommended `~/.config/gtk-3.0/gtk.css`

```css
:not(tooltip) decoration, headerbar { border-radius: 0; box-shadow: none; }
```

## Contributing

Pull requests welcome for features and fixes!

## License

GPL2
