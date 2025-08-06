export class PagingObj {
  constructor(
    public totalRecords?: number,
    public currentPageNumber?: number,
    public pageSize?: number,
    public totalPages?: number,
    public hasNextPage?: boolean,
    public hasPreviousPage?: boolean,
    public data?: any,
    public filteredRecordsCount?: number
  ) {
  }
}
