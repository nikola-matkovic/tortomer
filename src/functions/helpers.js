export function roundNumber(num){
  return +(Math.round(num + "e+2")  + "e-2");
}

export function removeWrongCharactersFromIngString(string){
  string = string.trim().replace(/[^0-9a-zA-ZčćžšđČĆŽŠĐ.,\-():; ]/g, "");

  return string
}