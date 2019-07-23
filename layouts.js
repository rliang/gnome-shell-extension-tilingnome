const Meta = imports.gi.Meta;

function horizontal(settings, wins, area) {
  const sr = settings.get_double('split-ratio');
  const mc = settings.get_uint('master-count');
  const size = mc < wins.length ? area.width * sr : area.width;
  return wins.slice(0, mc).map((_, i, part) => new Meta.Rectangle({
    x:      area.x,
    y:      area.y + (i * area.height / part.length),
    width:  size,
    height: area.height / part.length
  })).concat(wins.slice(mc).map((_, i, part) => new Meta.Rectangle({
    x:      area.x + size,
    y:      area.y + (i * area.height / part.length),
    width:  area.width - size,
    height: area.height / part.length
  })));
}

function vertical(settings, wins, area) {
  const sr = settings.get_double('split-ratio');
  const mc = settings.get_uint('master-count');
  const size = mc < wins.length ? area.height * sr : area.height;
  return wins.slice(0, mc).map((_, i, part) => new Meta.Rectangle({
    x:      area.x + (i * area.width / part.length),
    y:      area.y,
    width:  area.width / part.length,
    height: size
  })).concat(wins.slice(mc).map((_, i, part) => new Meta.Rectangle({
    x:      area.x + (i * area.width / part.length),
    y:      area.y + area.width * sr,
    width:  area.width / part.length,
    height: area.height - size
  })));
}

function spiral(settings, wins, area, part) {
  if (wins.length === 1)
    return [area];
  part = part || 0;
  const sr = settings.get_double('split-ratio');
  const mr = [
    {x: area.x, y: area.y, width: area.width * sr, height: area.height},
    {x: area.x, y: area.y, width: area.width, height: area.height * sr},
    {x: area.x + area.width * sr, y: area.y, width: area.width * (1 - sr), height: area.height},
    {x: area.x, y: area.y + area.height * sr, width: area.width, height: area.height * (1 - sr)},
  ].map(r => new Meta.Rectangle(r));
  return [mr[part]].concat(spiral(settings, wins.slice(1), mr[[2, 3, 0, 1][part]], part + 1 > 3 ? 0 : part + 1));
}
