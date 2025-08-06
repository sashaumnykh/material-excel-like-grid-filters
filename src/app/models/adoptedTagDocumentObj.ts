type Guid = string & { _guidBrand: undefined };

export class AdoptedTagDocumentObj {
  constructor(
    public id?: Guid,
    public documentNumber?: string,
    public documentRevision?: string,
    public type?: AdoptedTagDocumentType,
    public editorId?: Guid,
    public changed?: Date,
    public tagName?: string
  ) {
  }
}

export enum AdoptedTagDocumentType {
  UsedFrom = 1, ParsedFrom = 2
}