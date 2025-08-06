type Guid = string & { _guidBrand: undefined };

export class AdoptedTagDiffObj {
  constructor(
    public id?: Guid,
    public adoptedTagId?: Guid,
    public change?: Date,
    public changeType?: string,
    public editorId?: Guid,
    public fieldName?: string,
    public oldValue?: string,
    public newValue?: string,
  ) {
  }
}