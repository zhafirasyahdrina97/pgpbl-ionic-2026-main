import { Component, OnInit, inject } from '@angular/core';
import { DataService } from '../data.service';
import { Router } from '@angular/router';
import * as L from 'leaflet';

@Component({
  selector: 'app-maps',
  templateUrl: './maps.page.html',
  styleUrls: ['./maps.page.scss'],
  standalone: false,
})

export class MapsPage implements OnInit {

  private dataService = inject(DataService);
  private router = inject(Router);

  map!: L.Map;

  constructor() { }

  ngOnInit() {

    // Icon marker
    const iconRetinaUrl = 'assets/icon/marker-icon-2x.png';
    const iconUrl = 'assets/icon/marker-icon.png';
    const shadowUrl = 'assets/icon/marker-shadow.png';

    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });

    L.Marker.prototype.options.icon = iconDefault;

    // Membuat peta
    if (!this.map) {
      setTimeout(() => {

        this.map = L.map('map').setView(
          [-7.7956, 110.3695],
          13
        );

        var osm = L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            attribution: '&copy; OpenStreetMap contributors'
          }
        );

        osm.addTo(this.map);

        this.loadPoints();

      });
    }
  }

  async loadPoints() {
    const points: any = await this.dataService.getPoints();

    for (const key in points) {
      if (points.hasOwnProperty(key)) {

        const point = points[key];

        const coordinates = point.coordinates
          .split(',')
          .map((c: string) => parseFloat(c));

        const marker = L.marker(
          coordinates as L.LatLngExpression
        ).addTo(this.map);


        marker.bindPopup(`
  <div class="point-popup">
    <strong class="point-name">${point.name}</strong>
    <div class="point-description">
      ${point.description || ''}
    </div>
    <div class="point-coordinates">
      ${point.coordinates}
    </div>

    <div class="popup-actions">
      <button type="button" class="edit-link" data-key="${key}">
        <ion-icon name="create-outline"></ion-icon>
        <span>EDIT</span>
      </button>

      <button type="button" class="delete-link" data-key="${key}" aria-label="Delete">
        <ion-icon name="trash-outline"></ion-icon>
      </button>
    </div>
  </div>
`);

      }
    }



    this.map.on('popupopen', (e) => {
      const popup = e.popup;
      const popupElement = popup.getElement();

      if (!popupElement) return;

      // EDIT: tetap menuju halaman editpoint
      const editButton =
        popupElement.querySelector('.edit-link');

      editButton?.addEventListener('click', (event) => {
        event.preventDefault();

        const key = (event.currentTarget as HTMLElement)
          .dataset['key'];

        if (key) {
          this.router.navigate(['/editpoint', key]);
        }
      });

      // DELETE: tetap menggunakan fungsi deletePoint
      const deleteButton =
        popupElement.querySelector('.delete-link');

      deleteButton?.addEventListener('click', async (event) => {
        event.preventDefault();

        const key = (event.currentTarget as HTMLElement)
          .dataset['key'];

        if (key) {
          await this.deletePoint(key, popup.getLatLng());
          this.map.closePopup();
        }
      });
    });


  }

  async deletePoint(key: string, latLng: L.LatLng | undefined) {
    await this.dataService.deletePoint(key);

    if (latLng) {
      this.map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          if (layer.getLatLng().equals(latLng)) {
            this.map.removeLayer(layer);
          }
        }
      });
    }
  }

}
