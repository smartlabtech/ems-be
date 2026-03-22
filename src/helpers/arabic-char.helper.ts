const obj = {
  'ة': 'ه',
  'آ': 'ا',
  'أ': 'ا',
  'إ': 'ا',
  'اَ': 'ا',
  'اِ': 'ا',
  'اُ': 'ا',
  'أُ': 'ا',
  'أِ': 'ا',
  'ؤ': 'و',
  'ئ': 'ي',
  'ى': 'ي',
  'ء': 'ا',
}

export const replaceArabicChar = (retStr) => {
  if(typeof retStr === 'object'){
    // tslint:disable-next-line: forin
    for (const key in retStr) {
      // tslint:disable-next-line: forin
      for (const char in obj) {
        retStr[key] = retStr[key].replace(new RegExp(char, 'g'), obj[char]);
      }
    }
    return retStr;
  }
  // tslint:disable-next-line: forin
  for (const char in obj) {
    retStr = retStr.replace(new RegExp(char, 'g'), obj[char]);
  }
  return retStr;
};
