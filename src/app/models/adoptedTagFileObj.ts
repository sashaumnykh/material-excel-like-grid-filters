type Guid = string & { _guidBrand: undefined };

export class AdoptedTagFileObj {
  constructor(
    public id?: Guid,
    public fileName?: string,
    public fileData?: Blob,
    public editorId?: Guid,
    public changed?: Date,
    public tagName?: string
  ) {
  }
}