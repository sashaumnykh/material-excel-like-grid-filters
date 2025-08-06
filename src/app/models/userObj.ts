import { Guid } from "../types/guid";

export class UserObj {
  constructor(
    public id?: Guid,
    public name?: string,
  ) {
  }
}
