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
  <strong>${point.name}</strong><br>
  ${point.description || ''}<br>
  <small>${point.coordinates}</small><br>
  <a href="#" class="edit-link" data-key="${key}">Edit</a>
  |
  <a href="#" class="delete-link" data-key="${key}">Delete</a>
`);
      }
    }

    this.map.on('popupopen', (e) => {
      const popup = e.popup;

      // EDIT
      const editLink = popup.getElement()?.querySelector('.edit-link');

      if (editLink) {
        editLink.addEventListener('click', (event) => {
          event.preventDefault();

          const key = (event.target as HTMLElement).dataset['key'];

          if (key) {
            this.router.navigate(['/editpoint', key]);
          }
        });
      }

      // DELETE
      const deleteLink = popup.getElement()?.querySelector('.delete-link');

      if (deleteLink) {
        deleteLink.addEventListener('click', (event) => {
          event.preventDefault();

          const key = (event.target as HTMLElement).dataset['key'];

          if (key) {
            this.deletePoint(key, popup.getLatLng());
          }
        });
      }
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
