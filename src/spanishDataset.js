import { DataSet } from 'obscenity';
import { pattern } from 'obscenity';
import { resolveConfusablesTransformer, resolveLeetSpeakTransformer, collapseDuplicatesTransformer } from 'obscenity';


/**
 * A dataset of profane Spanish words.
 * Compatible with the obscenity package's DataSet class.
 */
export const spanishDataset = new DataSet()
  .addPhrase((phrase) => 
    phrase
      .setMetadata({ originalWord: 'puta' })
      .addPattern(pattern`|puta|`)
      .addWhitelistedTerm('disputa')
      .addWhitelistedTerm('computadora')
      .addWhitelistedTerm('reputacion')
  )
  .addPhrase((phrase) => 
    phrase
      .setMetadata({ originalWord: 'puto' })
      .addPattern(pattern`|puto|`)
      .addWhitelistedTerm('disputo')
      .addWhitelistedTerm('computador')
      .addWhitelistedTerm('imputo')
  )
  .addPhrase((phrase) => 
    phrase
      .setMetadata({ originalWord: 'joder' })
      .addPattern(pattern`joder`)
      .addPattern(pattern`jodido`)
  )
  .addPhrase((phrase) => 
    phrase
      .setMetadata({ originalWord: 'coño' })
      .addPattern(pattern`coño`)
  )
  .addPhrase((phrase) => 
    phrase
      .setMetadata({ originalWord: 'cojones' })
      .addPattern(pattern`cojones`)
      .addPattern(pattern`cojon`)
  )
  .addPhrase((phrase) => 
    phrase
      .setMetadata({ originalWord: 'polla' })
      .addPattern(pattern`polla`)
      .addWhitelistedTerm('pollo')
      .addWhitelistedTerm('apollo')
      .addWhitelistedTerm('apolla')
  )
  .addPhrase((phrase) => 
    phrase
      .setMetadata({ originalWord: 'mierda' })
      .addPattern(pattern`mierda`)
  )
  .addPhrase((phrase) => 
    phrase
      .setMetadata({ originalWord: 'carajo' })
      .addPattern(pattern`carajo`)
  )
  .addPhrase((phrase) => 
    phrase
      .setMetadata({ originalWord: 'pendejo' })
      .addPattern(pattern`pendejo`)
      .addPattern(pattern`pendeja`)
  )
  .addPhrase((phrase) => 
    phrase
      .setMetadata({ originalWord: 'cabrón' })
      .addPattern(pattern`cabrón`)

  )
  .addPhrase((phrase) => 
    phrase
      .setMetadata({ originalWord: 'chinga' })
      .addPattern(pattern`chinga`)

      
  )
  .addPhrase((phrase) => 
    phrase
      .setMetadata({ originalWord: 'verga' })
      .addPattern(pattern`verga`)

  )
  .addPhrase((phrase) => 
    phrase
      .setMetadata({ originalWord: 'coger' })
      .addPattern(pattern`cogiendo`)
      .addWhitelistedTerm('escoger')
      .addWhitelistedTerm('recoger')
      .addWhitelistedTerm('acoger')
  )
  .addPhrase((phrase) => 
    phrase
      .setMetadata({ originalWord: 'culo' })
      .addPattern(pattern`|culo`)
      .addPattern(pattern`culiadero`)
      .addWhitelistedTerm('calculo')
      .addWhitelistedTerm('articulo')
      .addWhitelistedTerm('curriculo')
  )
  .addPhrase((phrase) => 
    phrase
      .setMetadata({ originalWord: 'follar' })
      .addPattern(pattern`follar`)
  )
  .addPhrase((phrase) => 
    phrase
      .setMetadata({ originalWord: 'gilipollas' })
      .addPattern(pattern`gilipoll`)
  )
  .addPhrase((phrase) => 
    phrase
      .setMetadata({ originalWord: 'maricón' })
      .addPattern(pattern`maricón`)
      .addPattern(pattern`marica`)
  )
  .addPhrase((phrase) => 
    phrase
      .setMetadata({ originalWord: 'concha' })
      .addPattern(pattern`|concha`)
      .addWhitelistedTerm('conchas marinas')
      .addWhitelistedTerm('las conchas')
  )
  .addPhrase((phrase) => 
    phrase
      .setMetadata({ originalWord: 'pinche' })
      .addPattern(pattern`pinche`)
  )
  .addPhrase((phrase) => 
    phrase
      .setMetadata({ originalWord: 'culero' })
      .addPattern(pattern`culer[oa]`)
  )
  .addPhrase((phrase) => 
    phrase
      .setMetadata({ originalWord: 'pajero' })
      .addPattern(pattern`pajer[oa]`)
      .addWhitelistedTerm('Mitsubishi Pajero')
  )
  .addPhrase((phrase) => 
    phrase
      .setMetadata({ originalWord: 'capullo' })
      .addPattern(pattern`capullo`)
      .addWhitelistedTerm('capullo de flor')
  )
  .addPhrase((phrase) => 
    phrase
      .setMetadata({ originalWord: 'mamada' })
      .addPattern(pattern`mamada`)
  )
  .addPhrase((phrase) => 
    phrase
      .setMetadata({ originalWord: 'perra' })
      .addPattern(pattern`perra`)
  )
  .addPhrase((phrase) => 
  phrase
    .setMetadata({originalWord: 'totito'})
    .addPattern(pattern`totito`)

  )
  .addPhrase((phrase) =>
  phrase
    .setMetadata({originalWord: 'panocha'})
    .addPattern(pattern`panocha`)
  );

////
  export function createSimpleTransformer(fn) {
    return {
      type:0,
      transform: fn
    };
  }
///

  export const toUnicodeLowerCaseTransformer = () => {
    return createSimpleTransformer((charCode) => {
        const originalChar = String.fromCharCode(charCode);
        const lowerChar = originalChar.normalize('NFC').toLocaleLowerCase();
        return lowerChar.charCodeAt(0);
    });
};

///

export const spanishEnglishBlacklistTransformers = [
  resolveConfusablesTransformer(),
  resolveLeetSpeakTransformer(),
  toUnicodeLowerCaseTransformer(), 
  collapseDuplicatesTransformer({
      defaultThreshold: 1,
      customThresholds: new Map([
          ['b', 2],
          ['e', 2],
          ['o', 2],
          ['l', 2],
          ['s', 2],
          ['g', 2],
      ]),
  }),
];
