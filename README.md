# gnome-shell-extension-tilingnome

Tiling window manager

## Features

* Horizontal, vertical layouts
* Gaps
* (Experimental) Multi-monitor

## Installation

```sh
git clone https://github.com/rliang/gnome-shell-extension-tilingnome ~/.local/share/gnome-shell/extensions/tilingnome@rliang.github.com
```

## Usage

Most of your daily interactions with the Tilingnome will be through the use of keyboard shortcuts. The available ones are listed below.

### Tiles

| Key                      | Function            | Description                                         |
| ------------------------ | ------------------- | --------------------------------------------------- |
| Super+__x__              | Toggle tile         | Toggle whether to tile the currently-focused window |
| Super+__return__         | Focus first tile    | Focus the first tile in the tile list               |
| Super+__j__              | Focus next tile     | Focus the next tile in the tile list                |
| Super+__k__              | Focus previous tile | Focus the previous tile in the tile list            |
| _Shift_+Super+__return__ | Swap first tile     | Swap currently-focused tile with the first tile     |
| _Shift_+Super+__j__      | Swap next tile      | Swap currently-focused tile with the next tile      |
| _Shift_+Super+__k__      | Swap prev tile      | Swap currently-focused tile with the previous tile  |

### Layouts

| Key                      | Function               | Description                                         |
| ------------------------ | ---------------------- | --------------------------------------------------- |
| Super+__z__              | Switch next layout     | Switch to the next available layout                 |
| _Shift_+Super+__z__      | Switch previous layout | Switch to the previous available layout             |

### Settings

You can also modify these from the Settings panel for the Tilingnome extension in [Gnome Tweaks](https://wiki.gnome.org/Apps/Tweaks).

| Key                      | Function               | Description                                         |
| ------------------------ | ---------------------- | --------------------------------------------------- |
| Super+__l__              | Decrease split         | Decrease the split ratio by the split ratio step    |
| Super+__h__\*            | Increase split         | Increase the split ratio by the split ratio step    |
| _Shift_+Super+__l__      | Decrease master count  | Decreate the master count by one                    |
| _Shift_+Super+__h__      | Increase master count  | Increase the master count by one                    |

\* May conflict with the Hide Window shortcut on some distributions (e.g., it does on Pop!_OS). To change a keybinding, you must edit the _schema.gschema.xml_ file in the source, run [glib-compile-schemas](https://developer.gnome.org/gio/stable/glib-compile-schemas.html) in the source directory, and then reload the extension either by restarting Gnome Shell on X11 (`alt+F2 r`) or logging out and logging back in on Wayland.

## Contributing

Pull requests welcome for features and fixes!

## Pending features

* More keybindings?
* More layouts?

## License

GPL2
