import { Component, OnInit, inject } from '@angular/core';

import { NavController, AlertController } from '@ionic/angular';

import { DataService } from '../data.service';

import * as L from 'leaflet';
import { icon, Marker } from 'leaflet';

const iconRetinaUrl = 'assets/icon/marker-icon-2x.png';
const iconUrl = 'assets/icon/marker-icon.png';
const shadowUrl = 'assets/icon/marker-shadow.png';

const iconDefault = icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-createpoint',
  templateUrl: './createpoint.page.html',
  styleUrls: ['./createpoint.page.scss'],
  standalone: false,
})

export class CreatepointPage implements OnInit {

  private navCtrl = inject(NavController);
  private alertCtrl = inject(AlertController);
  private dataService = inject(DataService);

  name = '';
  coordinates = '';
  description = '';

  map!: L.Map;
  marker!: L.Marker;

  async save() {
    if (this.name && this.coordinates) {
      try {
        const pointData = {
          name: this.name,
          coordinates: this.coordinates,
          description: this.description
        };

        await this.dataService.savePoint(pointData);
        this.navCtrl.back();

      } catch (error: any) {
        const alert = await this.alertCtrl.create({
          header: 'Save Failed',
          message: error.message,
          buttons: ['OK'],
        });

        await alert.present();
      }
    }
  }

  constructor() { }

  ngOnInit() {

  setTimeout(() => {

    this.map = L.map('mapcreate').setView(
      [-7.7956, 110.3695],
      13
    );

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; OpenStreetMap contributors'
      }
    ).addTo(this.map);

    // Klik pada peta untuk membuat marker
    this.map.on('click', (e: L.LeafletMouseEvent) => {

      const lat = e.latlng.lat.toFixed(9);
      const lng = e.latlng.lng.toFixed(9);

      // Mengisi koordinat
      this.coordinates = `${lat},${lng}`;

      // Jika marker sudah ada, pindahkan marker
      if (this.marker) {

        this.marker.setLatLng(e.latlng);

      } else {

        // Membuat marker
        this.marker = L.marker(e.latlng, {
          draggable: true
        }).addTo(this.map);

        // Ketika marker digeser
        this.marker.on('dragend', (event) => {

          const position = event.target.getLatLng();

          const newLat = position.lat.toFixed(9);
          const newLng = position.lng.toFixed(9);

          this.coordinates = `${newLat},${newLng}`;

        });

      }

    });

    // Memperbaiki ukuran peta
    setTimeout(() => {
      this.map.invalidateSize();
    }, 200);

  }, 100);

}

}
