function horizontal(settings, wins, { x, y, width, height }) {
  const sr = settings.get_double('split-ratio');
  const mc = settings.get_uint('master-count');
  const w1 = mc < wins.length ? width * sr : width;
  return wins.slice(0, mc).map((_, i, part) => ({
    x:      x,
    y:      y + (i * height / part.length),
    width:  w1,
    height: Math.ceil(height / part.length)
  })).concat(wins.slice(mc).map((_, i, part) => ({
    x:      x + w1,
    y:      y + (i * height / part.length),
    width:  width - w1,
    height: Math.ceil(height / part.length)
  })));
}

function vertical(settings, wins, { x, y, width, height }) {
  const sr = settings.get_double('split-ratio');
  const mc = settings.get_uint('master-count');
  const h1 = mc < wins.length ? height * sr : height;
  return wins.slice(0, mc).map((_, i, part) => ({
    x:      x + (i * width / part.length),
    y:      y,
    width:  Math.ceil(width / part.length),
    height: h1
  })).concat(wins.slice(mc).map((_, i, part) => ({
    x:      x + (i * width / part.length),
    y:      y + h1,
    width:  Math.ceil(width / part.length),
    height: height - h1
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
  ];
  return [mr[part]].concat(spiral(settings, wins.slice(1), mr[[2, 3, 0, 1][part]], part + 1 > 3 ? 0 : part + 1));
}
