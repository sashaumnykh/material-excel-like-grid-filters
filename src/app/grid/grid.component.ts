type Guid = string & { _guidBrand: undefined };

import { Component, Inject, ElementRef, ViewChild, OnInit, AfterViewInit, Input, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpRequest, HttpEventType, HttpResponse } from '@angular/common/http';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { BehaviorSubject, Observable, Subject, catchError, map, merge, of as observableOf, startWith, switchMap  } from 'rxjs';

import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { UserObj } from '../models/userObj';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { AdoptedTagObj, AdoptedTagRow, AdoptedTagStatus } from '../models/adoptedTagObj';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatButtonToggleGroup } from '@angular/material/button-toggle';
import { AdoptedTagFileObj } from '../models/adoptedTagFileObj';
import { AdoptedTagDiffObj } from '../models/adoptedTagDiffObj';
import { MatDialog } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';
import { AdoptedTagDocumentObj } from '../models/adoptedTagDocumentObj';
import { PagingObj } from '../models/pagingObj';
import { AdoptedTagFilter } from '../models/adoptedTagFilter';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.scss'],
  providers: [ DataService ],
  standalone: false,
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})

export class GridComponent {
  //Source table variables
  dataSource: MatTableDataSource<AdoptedTagRow> = new MatTableDataSource();
  dataSource2: MatTableDataSource<AdoptedTagRow> = new MatTableDataSource();
  @ViewChild(MatSort, { static: false }) sort: MatSort = new MatSort();
  
  @ViewChild('paginatorTop') topPaginator: MatPaginator = new MatPaginator(new MatPaginatorIntl(), ChangeDetectorRef.prototype);
  @ViewChild('paginatorBottom') bottomPaginator: MatPaginator = new MatPaginator(new MatPaginatorIntl(), ChangeDetectorRef.prototype);

  displayedColumns: string[] = ['Select', 'TagName', 'AdoptedType', 'Status', 'Created', 'UsedFromDoc', 'User'];
  displayedFilterColumns: string[] = ['SelectFilter', 'TagNameFilter', 'AdoptedTypeFilter', 'StatusFilter', 'CreatedFilter', 'UsedFromDocFilter', 'UserFilter'];
  selection = new SelectionModel<AdoptedTagRow>(true, []);

  resultsLength: number = 0;

  listAdoptedTypes: string[]  = ['CYRILLIC', 'TYPO', 'SPACE', 'SPECIAL_SYMBOLS', 'OTHER'];
  listAdoptedTagsStatuses: string[] = ['INBOX', 'VOID', 'ACTIVE'];
  puslishedStatus: AdoptedTagStatus | undefined = {};
  listAdoptedTags: AdoptedTagObj[] = [];
  listAdoptedTagsRows: AdoptedTagRow[] = [];

  sortedData: AdoptedTagRow[] = [];

  listUsers: UserObj[] = [];
  selectedUser: UserObj | string = 'all';
  userControl = new FormControl();
  filteredUsers: Observable<UserObj[]> = new Observable<UserObj[]>();

  listSelectedTagHistory: AdoptedTagDiffObj[] = [];

  user: UserObj = {};

  arrowIconSubject = new BehaviorSubject('arrow_drop_down');
  expandedElement: AdoptedTagRow | null = null;

  enableFilters = false;

  // for filters
  listFilteredRows: AdoptedTagRow[] = [];
  nameFilter: string = '';
  selectedDate: Date | null = null;
  form: FormGroup;
  dateFilterControl = new FormControl(new Date());
  dateFilterGroup: FormGroup;
  selectedStatus: string = '';
  listUFDNumbers: AdoptedTagDocumentObj[] = [];
  selectedUFDNumber: string = '';
  listPFDNumbers: AdoptedTagDocumentObj[] = [];
  selectedPFDNumber: string = '';

  adoptedTagFilter: AdoptedTagFilter = new AdoptedTagFilter();

  sortColumn: string = 'TagName';
  sortDirection: string = 'asc';

  ///////////////

  constructor(private http: HttpClient,
    private dataService: DataService,
    private tagDataDialog: MatDialog,
    private docInfoDialog: MatDialog,
    private importDialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.form = fb.group({
      dateFilterControl: this.dateFilterControl
    });
    this.dateFilterControl.valueChanges.subscribe((v) => {
      this.selectedDate = v;
    })
    this.dateFilterGroup = new FormGroup({
      dateFilterControl: new FormControl()
    });
  }

  async ngOnInit() {
    
    this.topPaginator.pageSize = 10;
    this.bottomPaginator.pageSize = 10;

    this.loadTags();
    this.loadUsers();
    this.loadUsedFromDoc();
    this.loadParsedFromDoc();
    this.getUser();
    this.dataSource.paginator = this.topPaginator;
    this.dataSource2.paginator = this.bottomPaginator;
  }

  async ngAfterViewInit() {
    while (this.listAdoptedTags.length==0) // define the condition as you like
      await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // OLD filters implementation before server-side pagination was applied
  /*
  applyFilters() {
    this.listFilteredRows = this.listAdoptedTagsRows;

    // filter by tag name
    if (this.nameFilter != '') {
      this.listFilteredRows = this.listFilteredRows.filter(x => {
        return x.adoptedTag?.tagName?.trim().toLowerCase().includes(this.nameFilter.trim().toLowerCase());
      });
    }

    // filter by date
    if (this.selectedDate != null) {
      this.listFilteredRows = this.listFilteredRows.filter(x => {
        if(typeof x.adoptedTag?.created !== "undefined") {
          var created = (new Date(x.adoptedTag?.created)).toLocaleDateString('en-US');
          return created == (this.selectedDate?.toLocaleDateString('en-US'));
        }
        else {
          return false;
        };
      });
    }

    // filter by status
    if (this.selectedStatus != 'all' && this.selectedStatus != '') {
      var status = this.listAdoptedTagsStatuses.find(s => s.status == this.selectedStatus);
      this.listFilteredRows = this.listFilteredRows.filter(x => {
        return x.adoptedTag?.statusId == status?.id;
      });
    }

    // filter by UsedFromDocumentNumber
    if (this.selectedUFDNumber == null) {
      this.listFilteredRows = this.listFilteredRows.filter(x => {
        return x.adoptedTag?.usedFromDocumentNumbers?.length == 0;
      });
    }
    else if (this.selectedUFDNumber != 'all' && this.selectedUFDNumber != '') {
      this.listFilteredRows = this.listFilteredRows.filter(x => {
        return x.adoptedTag?.usedFromDocumentNumbers?.find(d => d.documentNumber == this.selectedUFDNumber);
      });
    }

    // filter by ParsedFromDocumentNumber
    if (this.selectedPFDNumber == null) {
      this.listFilteredRows = this.listFilteredRows.filter(x => {
        return x.adoptedTag?.parsedFromDocumentNumbers?.length == 0;
      });
    }
    else if (this.selectedPFDNumber != 'all' && this.selectedPFDNumber != '') {
      this.listFilteredRows = this.listFilteredRows.filter(x => {
        return x.adoptedTag?.parsedFromDocumentNumbers?.find(d => d.documentNumber == this.selectedUFDNumber);
      });
    }
    
    this.dataSource = new MatTableDataSource(this.listFilteredRows);
    this.dataSource2 = this.dataSource;
    this.topPaginator.length = this.listFilteredRows.length;
    this.bottomPaginator.length = this.listFilteredRows.length;
    this.dataSource.paginator = this.topPaginator;
    this.dataSource2.paginator = this.bottomPaginator;
  }
  */

  sortData(sort: Sort) {
    this.sortDirection = sort.direction;
    this.sortColumn = sort.active;
    this.loadTags();
  }

  compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  getUser() {
    let userJson = localStorage.getItem('user');
    if (userJson) {
      this.user = JSON.parse(userJson) as UserObj;
    }
  }

  loadTags() {
    merge(this.sort.sortChange, this.topPaginator.page)
      .pipe(
        startWith({}),
        switchMap(() => {
          return this.dataService.getAdoptedTags(this.adoptedTagFilter, this.topPaginator.pageIndex, this.topPaginator.pageSize,
                                            this.sortColumn, this.sortDirection)
            .pipe(catchError(() => observableOf(null)));
        }),
        map(data => {
          if (data === null) {
              return new PagingObj();
          }
          var paging = data as PagingObj;
          this.resultsLength = paging.totalRecords || 0;
          return paging;
        }),
      )
      .subscribe(paging => {
        if (paging === null)
          return;

        this.listAdoptedTags = paging.data as AdoptedTagObj[];
        this.listAdoptedTagsRows = this.listAdoptedTags.map(e => new AdoptedTagRow(e, false));

        this.dataSource = new MatTableDataSource(this.listAdoptedTagsRows);
        this.dataSource2 = this.dataSource;
      });
    
  }

  loadUsers() {
    this.dataService.getUsers().subscribe(result => {
      this.listUsers = result as UserObj[];
      this.filteredUsers = this.userControl.valueChanges.pipe(
        startWith(''),
        map(value => {
          const name = typeof value === 'string' ? value : value?.name;
          return name ? this._userFilter(name as string) : this.listUsers.slice();
        }),
      );
    }, error => {
      console.error(error);
      console.error(error.error);
    });
  }

  private _userFilter(name: string): UserObj[] {
    const filterValue = name.toLowerCase();
    if (name === 'all') {
      return this.listUsers;
    }
    return this.listUsers.filter(option => option?.name?.toLowerCase().includes(filterValue));
  }

  public handlePageTop(e: any) {
    let {pageSize} = e;

    this.selection.clear();

    this.bottomPaginator.pageSize = pageSize;

    if(!this.topPaginator.hasNextPage()){
      this.bottomPaginator.lastPage();
    }else if(!this.topPaginator.hasPreviousPage()){
      this.bottomPaginator.firstPage();
    }else{
      if(this.topPaginator.pageIndex < this.bottomPaginator.pageIndex){
        this.bottomPaginator.previousPage();
      } else  if(this.topPaginator.pageIndex >this.bottomPaginator.pageIndex){
        this.bottomPaginator.nextPage();
      }
    }

    this.loadTags();
  }

  public handlePageBottom(e: any) {
    let {pageSize} = e;

    this.selection.clear();

    this.topPaginator.pageSize = pageSize;
    if(!this.bottomPaginator.hasNextPage()){
      this.topPaginator.lastPage();
    }else if(!this.bottomPaginator.hasPreviousPage()){
      this.topPaginator.firstPage();
    }else{
      if(this.bottomPaginator.pageIndex < this.topPaginator.pageIndex){
        this.topPaginator.previousPage();
      } else  if(this.bottomPaginator.pageIndex > this.topPaginator.pageIndex){
        this.topPaginator.nextPage();
      }
    }
  }

  loadUsedFromDoc() {

  }

  loadParsedFromDoc() {

  }
  
  
  onRowClick(row: AdoptedTagRow) {
    row.isSelected = true;

  }
  
  getUserNameById(id: Guid) {
    var user = this.listUsers.find(u => u.id == id);
    return user?.name;
  }

  displayUser(user: UserObj): string {
    return user && user.name ? user.name : 'All users';
  }

  isPublished(tag: AdoptedTagObj) {
    return tag.status == 'ACTIVE' || tag.status == 'VOID';
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    //const numRows = this.dataSource.data.length;
    const pageSize = this.topPaginator.pageSize;
    return numSelected === pageSize;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    var page = this.topPaginator.pageIndex;
    var size = this.topPaginator.pageSize;
    this.selection.select(...this.dataSource.data.slice(page * size, (page + 1) * size));
  }

  checkboxLabel(row?: AdoptedTagRow): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row}`;
  }

  openOrClosePanel(evt: any, trigger: MatAutocompleteTrigger): void {
    evt.stopPropagation();
    if(trigger.panelOpen)
      trigger.closePanel();
    else
      trigger.openPanel();
  }

}


