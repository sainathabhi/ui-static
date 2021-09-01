import { Component, OnInit, OnDestroy } from '@angular/core'
import { BrowseProviderService } from '../../services/browse-provider.service'
import { Subscription, Subject } from 'rxjs'
import { ActivatedRoute } from '@angular/router'
// tslint:disable
import _ from 'lodash'
import { FormGroup, FormControl } from '@angular/forms';
import { debounceTime, switchMap, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'ws-app-provider-all-cbp',
  templateUrl: './provider-all-cbp.component.html',
  styleUrls: ['./provider-all-cbp.component.scss'],
  host: { class: 'flex flex-1' },
})
export class ProviderAllCbpComponent implements OnInit, OnDestroy {
  private paramSubscription: Subscription | null = null
  page = 1
  defaultLimit = 10
  limit = 10
  cbps: any
  totalCount: any
  provider = ''
  sortBy: any
  searchQuery = ''
  searchForm: FormGroup | undefined
  disableLoadMore =  false
  private unsubscribe = new Subject<void>()
  searchReq = {
    request: {
      filters: {
        primaryCategory: [
          'Course',
          'Program',
        ],
        source: [''],
      },
      query: '',
      sort_by: {
        name: 'asc',
      },
      limit: this.limit,
      offset: 0,
      fields: [],
      facets: ['primaryCategory', 'mimeType', 'source'],
    },
  }

  constructor(
    private browseProviderSvc: BrowseProviderService,
    private activatedRoute: ActivatedRoute,
  ) {
    
  }

  ngOnInit() {
    if(this.activatedRoute.parent){
      this.paramSubscription = this.activatedRoute.parent.params.subscribe(async (params: any) => {
        this.provider = _.get(params, 'provider')
        this.searchReq.request.filters.source.splice(0,1, this.provider)
        this.getAllCbps()
      })
    }
    this.searchForm = new FormGroup({
      sortByControl: new FormControl(''),
      searchKey: new FormControl(''),
    })
    this.searchForm.valueChanges
      .pipe(
        debounceTime(500),
        switchMap(async formValue => {
          this.sortBy = formValue.sortByControl
          this.updateQuery(formValue.searchKey)
        }),
        takeUntil(this.unsubscribe)
      ).subscribe()
  }

  getAllCbps(req?: any) {
    const request = req || this.searchReq
    this.browseProviderSvc.fetchSearchData(request).subscribe((res: any) => {
      console.log('res ::', res)
      if (res && res.result &&  res.result && res.result.content) {
        this.cbps = res.result.content
        this.totalCount = res.result.count
        if ((this.page * this.defaultLimit) >= this.totalCount) {
          this.disableLoadMore = true
        } else {
          this.disableLoadMore = false
        }
      }
    })
  }

  updateQuery(key: string) {
    this.searchQuery = key
    this.searchReq.request.query = this.searchQuery
    this.searchReq.request.offset = 0
    this.searchReq.request.limit = this.defaultLimit
    this.page = 1
    this.searchReq.request.sort_by.name = this.sortBy
    this.getAllCbps()
  }

  loadMore() {
    this.page = this.page + 1
    // this.getAllProvidersReq.request.offset = this.page * this.limit
    this.limit = (this.page * this.defaultLimit) || this.defaultLimit
    this.searchReq.request.limit = this.limit
    this.getAllCbps()
    if ((this.page * this.defaultLimit) >= this.totalCount) {
      this.disableLoadMore = true
      } else {
        this.disableLoadMore = false
      }
  }

  ngOnDestroy() {
    if (this.paramSubscription) {
      this.paramSubscription.unsubscribe()
    }
  }

}
