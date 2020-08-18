/*
  Copyright 2019 Esri
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  OnDestroy
} from '@angular/core';
import { loadModules } from 'esri-loader';
import esri = __esri; // Esri TypeScript Types
import { HttpClient } from '@angular/common/http';
import { AppConfig } from './../app.config';

import * as cloud from 'd3-cloud';
import * as d3 from 'd3';

import { viewClassName } from '@angular/compiler';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';

@Component({
  selector: 'app-esri-map',
  templateUrl: './esri-map.component.html',
  styleUrls: ['./esri-map.component.scss']
})
export class EsriMapComponent implements OnInit, OnDestroy {
  @Output() mapLoadedEvent = new EventEmitter<boolean>();

  // The <div> where we will place the map
  @ViewChild('mapViewNode', { static: true }) private mapViewEl: ElementRef;
  @ViewChild('wordCloudNode', { static: true }) private wordCloudEl: ElementRef;

  private _loaded = false;
  private _view: esri.MapView = null;
  private _debouncing = false;

  private _lastQuestionAnswers = [];

  private _webMapId: string = AppConfig.settings.items.webMap;
  private _surveyService: string = AppConfig.settings.services.survey;
  private _portalUrl: string = AppConfig.settings.portal.url;
  private _appId: string = AppConfig.settings.auth.appId;

  private _cloud = null;
  private _svg = null;

  public _question: string = AppConfig.settings.text.question;

  get mapLoaded(): boolean {
    return this._loaded;
  }

  constructor(private http: HttpClient) {}

  async initializeMap() {
    try {
      // Load the modules for the ArcGIS API for JavaScript
      const [EsriWebMap, EsriMapView, EsriWatchUtils, EsriFeatureLayer] = await loadModules([
        'esri/WebMap',
        'esri/views/MapView',
        'esri/core/watchUtils',
        'esri/layers/FeatureLayer'
      ]);

      const [EsriOAuth, EsriId] = await loadModules([
        'esri/identity/OAuthInfo',
        'esri/identity/IdentityManager'
      ]);

      const oAuthInfo = new EsriOAuth({
        appId: this._appId,
        portalUrl: this._portalUrl
      });
      EsriId.registerOAuthInfos([oAuthInfo]);

      // Configure the Map
      const webMapProperties: esri.WebMapProperties = {
        portalItem: {
          id: this._webMapId
        }
      };

      const map: esri.WebMap = new EsriWebMap(webMapProperties);

      // Initialize the MapView
      const mapViewProperties: esri.MapViewProperties = {
        container: this.mapViewEl.nativeElement,
        map
      };

      this._view = new EsriMapView(mapViewProperties);

      await this._view.when();

      EsriWatchUtils.whenTrue(this._view, 'stationary', () => {
        if (this._view.extent) {
          this._extentChanged();
        }
      });

      return this._view;
    } catch (error) {
      console.log('EsriLoader: ', error);
    }
  }

  _refreshWordCloud(questionAnswers) {
    const colors = ['green', 'red', 'blue'];

    const words = questionAnswers.map((d) => {
      return {
        text: d,
        size: 90 + Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)]
      };
    });

    const margin = {top: 10, right: 10, bottom: 10, left: 10},
      width = 450 - margin.left - margin.right,
      height = 450 - margin.top - margin.bottom;

    this._svg = d3.select("#wordCloudNode").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

    this._cloud = cloud().size([width, height])
      .words(words)
      .font('Impact')
      .fontSize((d) => d.size)
      .on('end', this.end);

    this._cloud.start();

    this._lastQuestionAnswers = questionAnswers;
  }

  end(words) {
    console.log(JSON.stringify(words));

    const test = this._svg.append("g")
      .attr("transform", "translate(" + this._cloud.size()[0] / 2 + "," + this._cloud.size()[1] / 2 + ")")
      .selectAll("text")
    console.log(test);
    const test1 = test.data(words);
    console.log(test1);
      test1.enter().append("text")
        .style("font-size", 20)
        .style("fill", "#69b3a2")
        .attr("text-anchor", "middle")
        .style("font-family", "Impact")
        .attr("transform", function(d) {
          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
        .text(function(d) { return d.text; });
  }

  _extentChanged() {
    if (!this._debouncing) {
      this._debouncing = true;
      setTimeout(() => {
        this._debouncing = false;
      }, 100);

      this._view.map.layers.forEach(layer => {
        const fl = layer as esri.FeatureLayer;
        if (fl.url === this._surveyService) {
          const query = fl.createQuery();
          query.geometry = this._view.extent;

          fl.queryFeatures(query).then((results) => {
            const questionAnswers = results.features.map((feature) => {
              return feature.attributes.Question;
            });

            if (!this.arraysEqual(questionAnswers, this._lastQuestionAnswers)) {
              this._refreshWordCloud(questionAnswers);
            }
          });
        }
      });
    }
  }

  arraysEqual(arr1, arr2) {
    if (!Array.isArray(arr1) || ! Array.isArray(arr2) || arr1.length !== arr2.length) {
      return false;
    }

    const sortedArr1 = arr1.concat().sort();
    const sortedArr2 = arr2.concat().sort();

    for (let i = 0; i < sortedArr1.length; i++) {
      if (sortedArr1[i] !== sortedArr2[i]) {
        return false;
      }
    }

    return true;
  }

  ngOnInit() {
    // Initialize MapView and return an instance of MapView
    this.initializeMap().then(mapView => {
      // The map has been initialized
      console.log('mapView ready: ', this._view.ready);
      this._loaded = this._view.ready;
      this.mapLoadedEvent.emit(true);
    });
  }

  ngOnDestroy() {
    if (this._view) {
      // destroy the map view
      this._view.container = null;
    }
  }
}
