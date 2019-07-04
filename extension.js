const Gio = imports.gi.Gio;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const Tweener = imports.ui.tweener;
const Main = imports.ui.main;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Utils = Me.imports.utils;

const SchemaSource = Gio.SettingsSchemaSource.new_from_directory(
  Me.dir.get_path(),
  Gio.SettingsSchemaSource.get_default(),
  false
);
const settings = new Gio.Settings({
  settings_schema: SchemaSource.lookup(Me.metadata["settings-schema"], true)
});
const bindings = new Gio.Settings({
  settings_schema: SchemaSource.lookup(
    Me.metadata["settings-schema"] + ".keybindings",
    true
  )
});

let _current_tiles = {};
let _current_layout = "horizontal";

function tileInit(win) {
  _current_tiles[win.get_stable_sequence()] = { idx: Infinity };
  refresh();
}

function tileInitAuto(win) {
  const types = settings.get_strv("auto-tile-window-types");
  if (types.some(t => win.window_type === Meta.WindowType[t])) tileInit(win);
}

function tileDestroy(win) {
  delete _current_tiles[win.get_stable_sequence()];
  refresh();
}

function tileInfo(win) {
  return _current_tiles[win.get_stable_sequence()] || null;
}

function tileCompare(w1, w2) {
  const i1 = tileInfo(w1);
  const i2 = tileInfo(w2);
  return i1.idx > i2.idx ? 1 : i1.idx < i2.idx ? -1 : 0;
}

function swapTiles(w1, w2) {
  const i1 = tileInfo(w1);
  const i2 = tileInfo(w2);
  if (!i1 || !i2) return;
  const tmp = i1.idx;
  refreshTile(w1, i2.idx);
  refreshTile(w2, tmp);
  refresh();
}

function addGaps(area, gaps) {
  return new Meta.Rectangle({
    x: Math.floor(area.x + gaps.x),
    y: Math.floor(area.y + gaps.y),
    width: Math.floor(area.width - gaps.width - gaps.x),
    height: Math.floor(area.height - gaps.height - gaps.y)
  });
}

function refreshTile(win, idx, rect) {
  const tile = tileInfo(win);
  if (tile.idx !== idx) {
    tile.idx = idx;
    const ming = settings.get_value("minimum-gaps").deep_unpack();
    const maxg = settings.get_value("maximum-gaps").deep_unpack();
    tile.gaps = new Meta.Rectangle({
      x: ming[0] + Math.random() * (maxg[0] - ming[0]),
      y: ming[1] + Math.random() * (maxg[1] - ming[1]),
      width: ming[2] + Math.random() * (maxg[2] - ming[2]),
      height: ming[3] + Math.random() * (maxg[3] - ming[3])
    });
  }
  if (rect) {
    rect = addGaps(rect, tile.gaps);
    Tweener.addTween(win.get_compositor_private(), {
      transition: settings.get_string("animation-transition"),
      time: settings.get_double("animation-duration"),
      scale_x: 1,
      scale_y: 1,
      translation_x: 0,
      translation_y: 0,
      onStart: (actor, r1, r2) => {
        if ((actor.translation_x = r1.x - r2.x) > 0)
          actor.translation_x -= r2.width - r1.width;
        if ((actor.translation_y = r1.y - r2.y) > 0)
          actor.translation_y -= r2.height - r1.height;
        actor.set_pivot_point(r2.x >= r1.x ? 0 : 1, r2.y >= r1.y ? 0 : 1);
        actor.set_scale(r1.width / r2.width, r1.height / r2.height);
      },
      onStartParams: [win.get_compositor_private(), win.get_frame_rect(), rect]
    });
    win.unmaximize(Meta.MaximizeFlags.BOTH);
    win.move_resize_frame(false, rect.x, rect.y, rect.width, rect.height);
  }
}

function refreshMonitor(mon) {
  const wksp = Utils.DisplayWrapper.getWorkspaceManager().get_active_workspace();
  const wins = wksp
    .list_windows()
    .filter(win => win.get_monitor() === mon)
    .filter(win => !win.fullscreen && !win.minimized)
    .filter(tileInfo)
    .sort(tileCompare);
  if (wins.length === 1 && settings.get_boolean("maximize-single"))
    return wins[0].maximize(Meta.MaximizeFlags.BOTH);
  const [x, y, width, height] = settings.get_value("margins").deep_unpack();
  const area = addGaps(
    wksp.get_work_area_for_monitor(mon),
    new Meta.Rectangle({ x: x, y: y, width: width, height: height })
  );
  Me.imports.layouts[_current_layout](settings, wins, area).forEach(
    (rect, idx) => refreshTile(wins[idx], idx, rect)
  );
}

function refresh() {
  Meta.later_add(Meta.LaterType.RESIZE, () =>
    Main.layoutManager.monitors.forEach((_, m) => refreshMonitor(m))
  );
}

let _handle_gs;
let _handle_sc;
let _handle_wm0;
let _handle_wm1;
let _handle_wm2;
let _handle_wm3;
let _handle_wm4;
let _handle_display;

function arrayNeighbor(array, el, n) {
  n += array.indexOf(el);
  const len = array.length;
  return n >= len ? array[0] : n < 0 ? array[len - 1] : array[n];
}

function getTiles() {
  return global.get_window_actors()
    .map(w => w.meta_window)
    .filter(tileInfo)
    .sort(tileCompare);
}

function getWorkspaceTiles() {
  return Utils.DisplayWrapper.getWorkspaceManager()
    .get_active_workspace()
    .list_windows()
    .filter(tileInfo)
    .sort(tileCompare);
}

function getFocusedWindow(win) {
  return Utils.DisplayWrapper.getWorkspaceManager()
    .get_active_workspace()
    .list_windows()
    .find(win => win.has_focus());
}

function addKeybinding(name, handler) {
  if (Shell.ActionMode)
    Main.wm.addKeybinding(
      name,
      bindings,
      Meta.KeyBindingFlags.NONE,
      Shell.ActionMode.NORMAL,
      handler
    );
  else
    Main.wm.addKeybinding(
      name,
      bindings,
      Meta.KeyBindingFlags.NONE,
      Shell.KeyBindingMode.NORMAL | Shell.KeyBindingMode.MESSAGE_TRAY,
      handler
    );
}

function enable() {
  const wm = global.window_manager;
  _handle_gs = settings.connect("changed", refresh);
  _handle_sc = Utils.DisplayWrapper.getScreen().connect("restacked", refresh);
  _handle_wm0 = wm.connect("switch-workspace", refresh);
  _handle_wm1 = wm.connect("map", (g, w) => tileInitAuto(w.meta_window));
  _handle_wm2 = wm.connect("destroy", (g, w) => tileDestroy(w.meta_window));
  _handle_wm3 = wm.connect("minimize", (g, w) => tileDestroy(w.meta_window));
  _handle_wm4 = wm.connect("unminimize", (g, w) => tileInitAuto(w.meta_window));
  _handle_display = global.display.connect("grab-op-end", (_0, _1, w1, op) => {
    if (op !== Meta.GrabOp.MOVING) return;
    const [px, py, pmask] = global.get_pointer();
    for (let m = 0; m < Main.layoutManager.monitors.length; m++) {
      const { x, y, width, height } = Main.layoutManager.monitors[m];
      if (px < x || px > x + width || py < y || py > y + height) continue;
      const p = new Meta.Rectangle({
        x: px - x,
        y: py - y,
        width: 1,
        height: 1
      });
      const w2 = getWorkspaceTiles().find(
        w =>
          w !== w1 &&
          w.get_monitor() === m &&
          w.get_frame_rect().intersect(p)[0]
      );
      if (w2) swapTiles(w1, w2);
      return;
    }
  });
  addKeybinding("toggle-tile", () => {
    const win = getFocusedWindow();
    if (!win) return;
    if (tileInfo(win)) tileDestroy(win);
    else tileInit(win);
  });
  addKeybinding("switch-next-layout", () => {
    const layouts = settings.get_strv("layouts");
    _current_layout = arrayNeighbor(layouts, _current_layout, 1);
    refresh();
  });
  addKeybinding("switch-previous-layout", () => {
    const layouts = settings.get_strv("layouts");
    _current_layout = arrayNeighbor(layouts, _current_layout, -1);
    refresh();
  });
  addKeybinding("focus-next-tile", () => {
    const win = arrayNeighbor(getWorkspaceTiles(), getFocusedWindow(), 1);
    if (win) win.focus(global.get_current_time());
  });
  addKeybinding("focus-previous-tile", () => {
    const win = arrayNeighbor(getWorkspaceTiles(), getFocusedWindow(), -1);
    if (win) win.focus(global.get_current_time());
  });
  addKeybinding("focus-first-tile", () => {
    const win = getWorkspaceTiles()[0];
    if (win) win.focus(global.get_current_time());
  });
  addKeybinding("swap-next-tile", () => {
    const w1 = getFocusedWindow();
    const w2 = arrayNeighbor(getWorkspaceTiles(), w1, 1);
    if (w1 && w2) swapTiles(w1, w2);
  });
  addKeybinding("swap-previous-tile", () => {
    const w1 = getFocusedWindow();
    const w2 = arrayNeighbor(getWorkspaceTiles(), w1, -1);
    if (w1 && w2) swapTiles(w1, w2);
  });
  addKeybinding("swap-first-tile", () => {
    const w1 = getFocusedWindow();
    const w2 = getWorkspaceTiles()[0];
    if (w1 && w2) swapTiles(w1, w2);
  });
  addKeybinding("increase-split", () => {
    const r = settings.get_double("split-ratio");
    const s = settings.get_double("split-ratio-step");
    settings.set_double("split-ratio", r + s);
  });
  addKeybinding("decrease-split", () => {
    const r = settings.get_double("split-ratio");
    const s = settings.get_double("split-ratio-step");
    settings.set_double("split-ratio", r - s);
  });
  addKeybinding("increase-master-count", () =>
    settings.set_uint("master-count", settings.get_uint("master-count") + 1)
  );
  addKeybinding("decrease-master-count", () =>
    settings.set_uint("master-count", settings.get_uint("master-count") - 1)
  );
  global.get_window_actors().forEach(w => tileInitAuto(w.meta_window));
}

function disable() {
  settings.disconnect(_handle_gs);
  Utils.DisplayWrapper.getScreen().disconnect(_handle_sc);
  global.display.disconnect(_handle_display);
  global.window_manager.disconnect(_handle_wm0);
  global.window_manager.disconnect(_handle_wm1);
  global.window_manager.disconnect(_handle_wm2);
  global.window_manager.disconnect(_handle_wm3);
  global.window_manager.disconnect(_handle_wm4);
  Main.wm.removeKeybinding("toggle-tile");
  Main.wm.removeKeybinding("switch-next-layout");
  Main.wm.removeKeybinding("switch-previous-layout");
  Main.wm.removeKeybinding("focus-next-tile");
  Main.wm.removeKeybinding("focus-previous-tile");
  Main.wm.removeKeybinding("focus-first-tile");
  Main.wm.removeKeybinding("swap-next-tile");
  Main.wm.removeKeybinding("swap-previous-tile");
  Main.wm.removeKeybinding("swap-first-tile");
  Main.wm.removeKeybinding("increase-split");
  Main.wm.removeKeybinding("decrease-split");
  Main.wm.removeKeybinding("increase-master-count");
  Main.wm.removeKeybinding("decrease-master-count");
  global.get_window_actors().forEach(w => tileDestroy(w.meta_window));
}
