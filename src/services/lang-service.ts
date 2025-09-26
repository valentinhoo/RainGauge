import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})


export class LangService {
  currentLang: string='en';
  private phrases: Record<string, Record<string, string>> = {
    en: {
      SEARCH: 'Search',
      AREA: 'Area',
      RUNWAY: 'Runway',
      SUBMIT: 'Submit'
    },
    hi: {
      SEARCH: 'खोजें',
      AREA: 'क्षेत्रफल',
      RUNWAY: 'रनवे',
      SUBMIT: 'जमा करें'
    },
    ta: {
      SEARCH: 'தேடவும்',
      AREA: 'பரப்பு',
      RUNWAY: 'ரன்ன்வே',
      SUBMIT: 'சமர்ப்பிக்கவும்'
    }
  };

  lang(key:string):string
  {
    return this.phrases[this.currentLang][key]||key;
  }
}
