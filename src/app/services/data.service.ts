import { Injectable } from '@angular/core';
import users from '../data/users.json';
import adoptedTags from '../data/tags.json';
import { Observable, of } from 'rxjs';
import { PagingObj } from '../models/pagingObj';
import { AdoptedTagFilter } from '../models/adoptedTagFilter';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  constructor() {}

  getUsers(): Observable<any[]> {
    return of(users);
  }

  getAdoptedTags(filters: AdoptedTagFilter, pageIndex: number, pageSize: number, sortColumn: string, sortDirection: string): Observable<PagingObj> {
    let data = [...(adoptedTags as any[])];

    // 1) filtering
    if (filters) {
      const f = filters;
      if (f.tagName) data = data.filter(t => t.tagName.toLowerCase().includes(f.tagName?.toLowerCase()));
      if (f.adoptedType) data = data.filter(t => t.adoptedType === f.adoptedType);
      if (f.status) data = data.filter(t => t.status === f.status);
      if (f.usedInDocument) {
        data = data.filter(t => t.usedInDocuments.some((d: string) => d.toLowerCase().includes(f.usedInDocument!.toLowerCase())));
      }
    }

    // 2) sorting
    if (sortColumn) {
      data = data.sort((a, b) => {
        const dir = (sortDirection === 'desc' ? -1 : 1);
        const v1 = a[sortColumn!], v2 = b[sortColumn!];
        return (v1 > v2 ? 1 : v1 < v2 ? -1 : 0) * dir;
      });
    }

    // counts
    const totalRecords = adoptedTags.length;
    const filteredRecordsCount = data.length;

    // 3) pagination
    const start = pageIndex * pageSize;
    const pageData = data.slice(start, start + pageSize);

    const totalPages = Math.ceil(filteredRecordsCount / pageSize);
    const current = pageIndex + 1;

    const paging = new PagingObj(
      totalRecords,
      current,
      pageSize,
      totalPages,
      current < totalPages,
      current > 1,
      pageData,
      filteredRecordsCount
    );

    return of(paging);
  }
}