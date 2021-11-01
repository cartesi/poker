const fs = require('fs');
console.log('build enums...')

function find_enum(src, name) {
  console.log('---> find_enum');
  var re = new RegExp("(enum\\s+" + name + "\\s+{[^}]+}).*");
  const match = src.match(re)
  return match[0];
}
function replace_enum(name, from, to) {
  const a = find_enum(from, name);
  const b = find_enum(to, name);
  return to.replace(b, a);
}

const h_path = `${__dirname}/../common.h`;
const common_h = fs.readFileSync(h_path).toString();
const ts_path = `${__dirname}/src/Engine.ts`;
let engine_ts = fs.readFileSync(ts_path).toString();
const enums = ['game_error', 'bet_type', 'game_step'];

console.log('Generating Engine.ts...');

for(let name of enums) {
  console.log(`Building ${name}`);
  engine_ts = replace_enum(name, common_h, engine_ts);
}

fs.copyFileSync(ts_path, ts_path + ".saved");
fs.writeFileSync(ts_path, engine_ts);

console.log('Engine.ts generated.');  


