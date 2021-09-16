import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core'
import { CompetenceService } from '../../services/competence.service'
// tslint:disable
import _ from 'lodash'
import { ActivatedRoute } from '@angular/router'
import { Subscription } from 'rxjs'
import { NSCompetencie } from '../../models/competencies.model'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material';
import { CompetenceViewComponent } from '../../components/competencies-view/competencies-view.component';
import { ConfigurationsService } from '@sunbird-cb/utils/src/public-api'

@Component({
  selector: 'ws-app-competency-detailed-view',
  templateUrl: './competency-detailed-view.component.html',
  styleUrls: ['./competency-detailed-view.component.scss']
})
export class CompetencyDetailedViewComponent implements OnInit, OnDestroy {
  @ViewChild('successMsg', { static: true }) successMsg!: ElementRef
  @ViewChild('failMsg', { static: true }) failureMsg!: ElementRef
  @ViewChild('successRemoveMsg', { static: true })
  successRemoveMsg!: ElementRef
  
  private paramSubscription: Subscription | null = null
  competencyName: any = null
  type: any = 'COMPETENCY'
  competencyId: any = null
  competencyData: any = null
  myCompetencies: any;
  currentProfile: any;
  courses: any[] = []
  facets: any
  searchReq = {
    request: {
        filters: {
            primaryCategory: [
                'Course',
                'Program',
            ],
            status: [
                'Live',
            ],
            'competencies_v3.name': [''],
        },
        query: '',
        sort_by: {
            lastUpdatedOn: '',
        },
        fields: [],
        facets: [
            'primaryCategory',
            'mimeType',
            'source',
            // 'competencies_v3.name',
            // 'competencies_v3.competencyType',
            // 'taxonomyPaths_v3.name',
        ],
    },
  }
  constructor(
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private activatedRoute: ActivatedRoute,
    private competencySvc: CompetenceService,
    private configSvc: ConfigurationsService,
  ) { this.getProfile() }

  ngOnInit() {
    this.paramSubscription = this.activatedRoute.params.subscribe(async params => {
      this.competencyId = _.get(params, 'competencyId')
      this.competencyName = _.get(params, 'competencyName')
      // console.log("Name", this.competencyName)
    })


    this.competencySvc
      .fetchCompetencyDetails(this.competencyId, this.type)
      .subscribe((reponse: NSCompetencie.ICompetencieResponse) => {
        if (reponse.statusInfo && reponse.statusInfo.statusCode === 200) {
          this.competencyData = reponse.responseData
          console.log(this.competencyData)
        }
      })
    
    this.getCbps()
  }

  getProfile() {
    this.competencySvc.fetchProfileById(this.configSvc.unMappedUser.id).subscribe(response => {
      if (response) {
        this.myCompetencies = response.profileDetails.competencies || []
        this.currentProfile = response.profileDetails
      }
    })
  }

  ngOnDestroy() {
    if (this.paramSubscription) {
      this.paramSubscription.unsubscribe()
    }
  }

  addCompetency(id: string) {
    if (id) {
      // API is not available
      const data = [this.competencyData]
      const vc = _.chain(data)
        .filter(i => {
          return i.id === id
        })
        .first()
        .value()

      console.log(vc)
      // this.myCompetencies.push(vc)
      this.addToProfile(vc)
      // this.reset()
    }
  }

  addToProfile(item: NSCompetencie.ICompetencie) {
    if (item) {
      const newCompetence = {
        type: item.type || 'COMPETENCY',
        id: item.id,
        name: item.name || '',
        description: item.description || '',
        status: item.status || '',
        source: item.source || '',
        competencyType: _.get(item, 'additionalProperties.competencyType') || item.type,
      }

      console.log(newCompetence)
      const updatedProfile = { ...this.currentProfile }
      if (
        _.get(this, 'currentProfile.competencies') &&
        _.get(this, 'currentProfile.competencies').length > 0
      ) {
        _.remove(
          updatedProfile.competencies, itm => _.get(itm, 'id') === item.id
        )
        updatedProfile.competencies.push(newCompetence)
      } else {
        updatedProfile.competencies = []
        updatedProfile.competencies.push(newCompetence)
      }
      const reqUpdate = {
        request: {
          userId: this.configSvc.unMappedUser.id,
          profileDetails: updatedProfile,
        },
      }
      this.competencySvc.updateProfile(reqUpdate).subscribe(response => {
        if (response) {
          // success
          // this.myCompetencies.push(item)
          this.snackBar.open('Compentency added successfully', 'X')
        }
      },
        /* tslint:disable */() => {
          this.snackBar.open('Failed to add compentency', 'X');
        } /* tslint:disable */
      );
    }
  }

  view(item?: NSCompetencie.ICompetencie) {
    const dialogRef = this.dialog.open(CompetenceViewComponent, {
      minHeight: 'auto',
      // width: '80%',
      panelClass: 'remove-pad',
      data: item,
    });
    const instance = dialogRef.componentInstance;
    instance.isUpdate = false;
    dialogRef.afterClosed().subscribe((response: any) => {
      console.log(response)
      if (response && response.action === 'ADD') {
        this.addCompetency(response.id);
        // this.refreshData(this.currentActivePage)
      } else if (response && response.action === 'DELETE') {
        this.deleteCompetency(response.id);
      }
    });
  }
  deleteCompetency(_id: any) {
    throw new Error("Method not implemented.");
  }

  getCbps() {
      this.searchReq.request.filters['competencies_v3.name'].splice(0, 1, this.competencyName)
      this.competencySvc.fetchSearchData(this.searchReq).subscribe((res: any) => {
        if (res && res.result &&  res.result && res.result.content) {
          this.courses = res.result.content
        }
        if (res && res.result &&  res.result && res.result.facets) {
          this.facets = res.result.facets
        }
      })
  }

}