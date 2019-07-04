const Meta = imports.gi.Meta;

function horizontal(settings, wins, area) {
  const sr = settings.get_double('split-ratio');
  const mc = Math.min(settings.get_uint('master-count'), wins.length - 1);
  const sz = wins.length;

  if(sz<2){
   return wins.slice(0, sz-mc).map((_, i, part) => new Meta.Rectangle( { //
      x:      area.x + area.width * (1 - sr),
      y:      area.y + ((mc-i) * area.height / part.length),
      width:  (area.width * sr),
      height: (area.height / part.length)
    }));
  }else if( mc>1 && sz-mc>0 ){
    return wins.slice(0, sz-mc).map((_, i, part) => new Meta.Rectangle( { //
      x:      area.x,
      y:      area.y + ((sz-mc-i-1) * area.height / part.length),
      width:  (area.width * (1 - sr)),
      height: (area.height / part.length)
    })).concat(wins.slice(sz-mc,sz-1).map((_, i, part) => new Meta.Rectangle({ //
      x:      area.x + (area.width*(1-sr)) + (i * area.width*sr / part.length),
      y:      area.y + area.height*sr,
      width:  (area.width * sr / part.length),
      height: (area.height * (1-sr))
    }))).concat(wins.slice(sz-1).map((_, i, part) => new Meta.Rectangle({ //
      x:      area.x + area.width * (1-sr),
      y:      area.y,
      width:  (area.width * sr),
      height: (area.height * sr)
    })));
  }else{
   return wins.slice(0, sz-mc).map((_, i, part) => new Meta.Rectangle( { //
      x:      area.x,
      y:      area.y + ((sz-mc-i-1) * area.height / part.length),
      width:  (area.width * (1 - sr)),
      height: (area.height / part.length)
    })).concat(wins.slice(sz-mc).map((_, i, part) => new Meta.Rectangle({ //
      x:      area.x + area.width * (1-sr),
      y:      area.y + ((mc-i-1) * area.height / part.length),
      width:  (area.width * sr),
      height: (area.height / part.length)
    })));
   }
}

function vertical(settings, wins, area) {
  const sr = settings.get_double('split-ratio');
  const mc = Math.min(settings.get_uint('master-count'), wins.length - 1);
  const sz = wins.length;

  if(sz<2){
    return wins.slice(0, mc).map((_, i, part) => new Meta.Rectangle({ // 0 to master count
      x:      area.x + (i * area.width / part.length),
      y:      area.y + area.height * sr,
      width:  (area.width / part.length),
      height: (area.height * (1 - sr))
   })).concat(wins.slice(mc).map((_, i, part) => new Meta.Rectangle({
      x:      area.x + (i * area.width / part.length),   
      y:      area.y,
      width:  (area.width / part.length),
      height: (area.height * sr)                                     //particion en altura
    })));
  }else if( mc>1 && sz-mc>0 ){
    return wins.slice(0, 1).map((_, i, part) => new Meta.Rectangle({ // 0 to master count
      x:      area.x,   
      y:      area.y,
      width:  (area.width * sr),
      height: (area.height * sr)                                     //particion en altura
    })).concat(wins.slice(1,mc).map((_, i, part) => new Meta.Rectangle({
      x:      area.x + area.width * sr,   
      y:      area.y + (i* area.height*sr / part.length),
      width:  (area.width *(1-sr)),
      height: (area.height *(sr) /part.length)                                     //particion en altura
    }))).concat(wins.slice(mc).map((_, i, part) => new Meta.Rectangle({
      x:      area.x + (i * area.width / part.length),
      y:      area.y + area.height * (sr),
      width:  (area.width / part.length),
      height: (area.height * (1 - sr))
    })));
  }else{
    return wins.slice(0, mc).map((_, i, part) => new Meta.Rectangle({ // 0 to master count
      x:      area.x + (i * area.width / part.length),   
      y:      area.y,
      width:  (area.width / part.length),
      height: (area.height * sr)                                     //particion en altura
    })).concat(wins.slice(mc).map((_, i, part) => new Meta.Rectangle({
      x:      area.x + (i * area.width / part.length),
      y:      area.y + area.height * (sr),
      width:  (area.width / part.length),
      height: (area.height * (1 - sr))
    })));
  }
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
