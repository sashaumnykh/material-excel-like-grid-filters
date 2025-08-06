export class AdoptedTagFilter {

  constructor(
    public tagName?: string,
    public adoptedType?: 'CYRILLIC' | 'TYPO' | 'SPACE' | 'SPECIAL_SYMBOLS' | 'OTHER',
    public status?: 'INBOX' | 'ACTIVE' | 'VOID',
    public created?: Date, 
    public userName?: string,
    public usedInDocument?: string
  ) {
  }
}
