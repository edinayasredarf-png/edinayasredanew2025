declare module 'petrovich' {
  export type Gender = 'male' | 'female' | 'androgynous';
  export type GrammCase =
    | 'nominative'
    | 'genitive'
    | 'dative'
    | 'accusative'
    | 'instrumental'
    | 'prepositional';

  interface NameParts {
    first?: string;
    last?: string;
    middle?: string;
    gender?: Gender;
  }

  function petrovich(name: NameParts, grammCase: GrammCase): Required<NameParts>;

  export default petrovich;
}
