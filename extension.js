const Gio            = imports.gi.Gio;
const St             = imports.gi.St;
const Meta           = imports.gi.Meta;
const Shell          = imports.gi.Shell;
const Main           = imports.ui.main;
const Mainloop       = imports.mainloop;
const ExtensionUtils = imports.misc.extensionUtils;

let _settings;
let _bindings;

const layouts = {
  horizontal: (wins, x, y, w, h) => {
    const sr = _settings.get_double('split-ratio');
    const mc = Math.min(_settings.get_uint('master-count'), wins.length - 1);
    return wins.slice(0, mc).map((_, i, part) => [
      x,
      y + (i * h / part.length),
      w * sr,
      h / part.length
    ]).concat(wins.slice(mc).map((_, i, part) => [
      x + w * sr,
      y + (i * h / part.length),
      w * (1 - sr),
      h / part.length
    ]));
  },
  vertical: (wins, x, y, w, h) => {
    const sr = _settings.get_double('split-ratio');
    const mc = Math.min(_settings.get_uint('master-count'), wins.length - 1);
    return wins.slice(0, mc).map((_, i, part) => [
      x + (i * w / part.length),
      y,
      w / part.length,
      h * sr
    ]).concat(wins.slice(mc).map((_, i, part) => [
      x + (i * w / part.length),
      y + w * sr,
      w / part.length,
      h * (1 - sr)
    ]));
  }
};

let _current_layout = 'horizontal';
let _current_tiles = {};

function tileInit(win) {
  _current_tiles[win.get_stable_sequence()] = {idx: Infinity};
}

function tileDestroy(win) {
  delete _current_tiles[win.get_stable_sequence()];
}

function tileInfo(win) {
  return _current_tiles[win.get_stable_sequence()];
}

function tileSort(w1, w2) {
  const i1 = tileInfo(w1);
  const i2 = tileInfo(w2);
  return i1.idx > i2.idx ? 1 : i1.idx < i2.idx ? -1 : 0;
}

function addGaps(area, gaps) {
  return [
    area[0] + gaps[0],
    area[1] + gaps[1],
    area[2] - gaps[2] - gaps[0],
    area[3] - gaps[3] - gaps[1]
  ];
}

function refreshTile(win, idx, geom) {
  const tile = tileInfo(win);
  if (tile.idx !== idx) {
    tile.idx = idx;
    const ming = _settings.get_value('minimum-gaps').deep_unpack();
    const maxg = _settings.get_value('maximum-gaps').deep_unpack();
    tile.gaps = ming.map((g, i) => g + Math.random() * (maxg[i] - g));
  }
  if (geom) {
    win.unmaximize(Meta.MaximizeFlags.BOTH);
    win.move_resize_frame.apply(win, [false].concat(addGaps(geom, tile.gaps)));
  }
}

function refreshMonitor(mon) {
  const wksp = global.screen.get_active_workspace();
  const wins = wksp.list_windows()
    .filter(win => win.get_monitor() === mon)
    .filter(tileInfo)
    .sort(tileSort);
  if (wins.length === 1 && _settings.get_boolean('maximize-single'))
    return wins[0].maximize(Meta.MaximizeFlags.BOTH);
  const marg = _settings.get_value('margins').deep_unpack();
  const rect = wksp.get_work_area_for_monitor(mon);
  const area = addGaps([rect.x, rect.y, rect.width, rect.height], marg);
  layouts[_current_layout].apply(null, [wins].concat(area))
    .forEach((geom, idx) => refreshTile(wins[idx], idx, geom));
}

function refresh() {
  Mainloop.idle_add(() => {
    for (let m = 0; m < global.screen.get_n_monitors(); m++)
      refreshMonitor(m);
  });
}

let _handle_gs;
let _handle_sc;
let _handle_wm0;
let _handle_wm1;
let _handle_wm2;
let _handle_display;

function arrayNeighbor(array, el, n) {
  n += array.indexOf(el);
  const len = array.length;
  return n >= len ? array[0] : n < 0 ? array[len - 1] : array[n];
}

function isTileable(win) {
  return _settings.get_strv('auto-tile-window-types')
    .some(t => win.window_type === Meta.WindowType[t]);
}

function getCurrentTiles() {
  return global.screen.get_active_workspace().list_windows()
    .filter(tileInfo).sort(tileSort);
}

function getFocusedWindow(win) {
  return global.screen.get_active_workspace().list_windows()
    .filter(win => win.has_focus())[0];
}

function swapTiles(w1, w2) {
  const i1 = tileInfo(w1);
  const i2 = tileInfo(w2);
  if (i1 && i2) {
    const tmp = i1.idx;
    refreshTile(w1, i2.idx);
    refreshTile(w2, tmp);
    refresh();
  }
}

function addKeybinding(name, handler) {
  Main.wm.addKeybinding(name, _bindings, 0, Shell.ActionMode.NORMAL, handler);
}

function enable() {
  _handle_gs = _settings.connect('changed', refresh);
  _handle_sc = global.screen.connect('restacked', refresh);
  _handle_wm0 = global.window_manager.connect('switch-workspace', refresh);
  _handle_wm1 = global.window_manager.connect('map', (g, w) => {
    if (isTileable(w.meta_window))
      tileInit(w.meta_window);
  });
  _handle_wm2 = global.window_manager.connect('destroy', (g, w) => {
    tileDestroy(w.meta_window);
  });
  _handle_display = global.display.connect('grab-op-end', (dis, scr, w1, op) => {
    if (op !== Meta.GrabOp.MOVING)
      return;
    const p = global.get_pointer();
    const r = new Meta.Rectangle({x: p[0], y: p[1], width: 1, height: 1});
    const w2 = getCurrentTiles()
      .filter(w => w !== w1 && w.get_frame_rect().intersect(r))[0];
    if (w2)
      swapTiles(w1, w2);
  });
  addKeybinding('toggle-tile', () => {
    const win = getFocusedWindow();
    if (!win)
      return;
    if (tileInfo(win))
      tileDestroy(win);
    else
      tileInit(win);
    refresh();
  });
  addKeybinding('switch-next-layout', () => {
    _current_layout = arrayNeighbor(_settings.get_strv('layouts'), _current_layout, 1);
    refresh();
  });
  addKeybinding('switch-previous-layout', () => {
    _current_layout = arrayNeighbor(_settings.get_strv('layouts'), _current_layout, -1);
    refresh();
  });
  addKeybinding('focus-next-tile', () => {
    const win = arrayNeighbor(getCurrentTiles(), getFocusedWindow(), 1);
    if (win)
      win.focus(global.get_current_time());
  });
  addKeybinding('focus-previous-tile', () => {
    const win = arrayNeighbor(getCurrentTiles(), getFocusedWindow(), -1);
    if (win)
      win.focus(global.get_current_time());
  });
  addKeybinding('focus-first-tile', () => {
    const win = getCurrentTiles()[0];
    if (win)
      win.focus(global.get_current_time());
  });
  addKeybinding('swap-next-tile', () => {
    const w1 = getFocusedWindow();
    const w2 = arrayNeighbor(getCurrentTiles(), w1, 1);
    if (w1 && w2)
      swapTiles(w1, w2);
  });
  addKeybinding('swap-previous-tile', () => {
    const w1 = getFocusedWindow();
    const w2 = arrayNeighbor(getCurrentTiles(), w1, -1);
    if (w1 && w2)
      swapTiles(w1, w2);
  });
  addKeybinding('swap-first-tile', () => {
    const w1 = getFocusedWindow();
    const w2 = getCurrentTiles()[0];
    if (w1 && w2)
      swapTiles(w1, w2);
  });
  addKeybinding('increase-split', () => {
    const r = _settings.get_double('split-ratio');
    _settings.set_double('split-ratio', r + _settings.get_double('split-ratio-step'));
  });
  addKeybinding('decrease-split', () => {
    const r = _settings.get_double('split-ratio');
    _settings.set_double('split-ratio', r - _settings.get_double('split-ratio-step'));
  });
  addKeybinding('increase-master-count', () => {
    const m = _settings.get_uint('master-count');
    _settings.set_uint('master-count', m + 1);
  });
  addKeybinding('decrease-master-count', () => {
    const m = _settings.get_uint('master-count');
    _settings.set_uint('master-count', m - 1);
  });
  global.get_window_actors().forEach(win => {
    if (isTileable(win.meta_window))
      tileInit(win.meta_window);
  });
}

function disable() {
  _settings.disconnect(_handle_gs);
  global.screen.disconnect(_handle_sc);
  global.display.disconnect(_handle_display);
  global.window_manager.disconnect(_handle_wm0);
  global.window_manager.disconnect(_handle_wm1);
  global.window_manager.disconnect(_handle_wm2);
  Main.wm.removeKeybinding('toggle-tile');
  Main.wm.removeKeybinding('switch-next-layout');
  Main.wm.removeKeybinding('switch-previous-layout');
  Main.wm.removeKeybinding('focus-next-tile');
  Main.wm.removeKeybinding('focus-previous-tile');
  Main.wm.removeKeybinding('focus-first-tile');
  Main.wm.removeKeybinding('swap-next-tile');
  Main.wm.removeKeybinding('swap-previous-tile');
  Main.wm.removeKeybinding('swap-first-tile');
  Main.wm.removeKeybinding('increase-split');
  Main.wm.removeKeybinding('decrease-split');
  Main.wm.removeKeybinding('increase-master-count');
  Main.wm.removeKeybinding('decrease-master-count');
  global.get_window_actors().forEach(win => {
    tileDestroy(win.meta_window);
  });
}

function init() {
  const me = ExtensionUtils.getCurrentExtension();
  const sr = Gio.SettingsSchemaSource.new_from_directory(
      me.dir.get_path(), Gio.SettingsSchemaSource.get_default(), false);
  const ss = me.metadata['settings-schema'];
  _settings = new Gio.Settings({
    settings_schema: sr.lookup(ss, true)
  });
  _bindings = new Gio.Settings({
    settings_schema: sr.lookup(ss + '.keybindings', true)
  });
}
