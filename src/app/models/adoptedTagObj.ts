import { AdoptedTagDocumentObj } from "./adoptedTagDocumentObj";

type Guid = string & { _guidBrand: undefined };

export class AdoptedTagObj {
  // related to airtable
  constructor(
    public id: Guid,
    public tagName: string,
    public adoptedType: 'CYRILLIC' | 'TYPO' | 'SPACE' | 'SPECIAL_SYMBOLS' | 'OTHER',
    public status: 'INBOX' | 'ACTIVE' | 'VOID',
    public created: Date, 
    public userId: string,
    public usedInDocuments: string[],
    public userName?: string
  ) {
    this.id = '00000000-0000-0000-0000-000000000000' as Guid;
    this.created = new Date();
  }
}

export class AdoptedTagRow {
  // related to airtable
  constructor(
    public adoptedTag?: AdoptedTagObj,
    public isEdit?: boolean,
    public isSelected?: boolean
  ) {
  }
}

export class AdoptedTagStatus {
  // related to airtable
  constructor(
    public id?: Guid,
    public status?: string,
  ) {
  }
}

export class AdoptedTagField {
  constructor(
    public id?: string,
    public name?: string
  ) {
  }
}