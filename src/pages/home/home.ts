import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController, Platform, ActionSheetController, AlertController, LoadingController } from 'ionic-angular';
import { Socket } from 'ng-socket-io';
import { Observable } from 'rxjs/Observable';
import { Geolocation }  from '@ionic-native/geolocation';
import { Network } from '@ionic-native/network'

import { NetworkPage } from './../network/network';
import { SHUTTLE_CONFIG } from './../../app/shuttle.config';

declare var google: any;

@Component({
  	selector: 'page-home',
  	templateUrl: 'home.html'
})
export class HomePage {
	@ViewChild('map') mapRef: ElementRef;
	map: any;
	mapCenter:any;
	latitude: any;
	longitude: any;
	mapZoomLevel:number;
	coordinates: any;
	markers = [];
	radiusCircle:any;

  	constructor(public navCtrl: NavController,private actionSheetCtrl: ActionSheetController, public socket: Socket, private geolocation: Geolocation, private platform: Platform, private network:Network, private alertCtrl: AlertController, private loadingCtrl: LoadingController) {}

  	setLatitude(latitude:any) {
  		this.latitude = latitude;
  	}

  	setLongitude(longitude: any) {
  		this.longitude = longitude;
  	}

  	setMapZoomLevel(mapZoomLevel: any) {
  		this.mapZoomLevel = mapZoomLevel;
  	}

  	getLatitude():any {
  		return this.latitude;
  	}

  	getLongitude():any {
  		return this.longitude;
  	}

  	getMapZoomLevel(): any {
  		return this.mapZoomLevel;
  	}

	ionViewDidEnter() {
		this.network.onConnect().subscribe(data => {
			this.showBusesLocations(this.latitude, this.longitude,this.coordinates);
		}, error => {
			console.error(error)
		})

		this.network.onDisconnect().subscribe(data => {
			this.navCtrl.push(NetworkPage);
		}, error => {
			console.error(error)
		})
	}


  	//when the page loads completely
  	ionViewDidLoad() {	
		this.platform.ready().then(() => {
			this.setMapZoomLevel(15)
			const options = {
				timeout: 3000
			}

			this.geolocation.getCurrentPosition(options).then(resp => {
				this.latitude = resp.coords.latitude;
				this.longitude = resp.coords.longitude;
				this.setLatitude(this.latitude);
				this.setLongitude(this.longitude);
				this.showBusesLocations(this.latitude, this.longitude,this.coordinates);
			}).catch(error => {
				let alert = this.alertCtrl.create({
				      title: "Could Not Get Your Current Location",
				      subTitle: "Please check your internet connection or make sure your GPS is enabled to get your location",
				      buttons: ['OK']
			    });
			    alert.present();
			    this.showBusesLocations(SHUTTLE_CONFIG.USER_DEFAULT_COORDINATES.LAT, SHUTTLE_CONFIG.USER_DEFAULT_COORDINATES.LON,this.coordinates);
			})

			this.socket.on('getAllCoordinates', (coordinates) => {
			 	this.updateBusLocations(coordinates);
			});

			this.getCoordinateUpdates().subscribe(coordinates => {
				this.updateBusLocations(coordinates);
			});

			this.requestCoordinates();

			setTimeout(() => {
				this.requestCoordinatesUpdate();
			}, 5000);
		})
	}

	//a method to get the coordinates of the shuttle
	showBusesLocations(lat, lon, coordinates) {

		if ((!this.latitude) && (!this.longitude)) {
			this.latitude = SHUTTLE_CONFIG.USER_DEFAULT_COORDINATES.LAT;
			this.longitude = SHUTTLE_CONFIG.USER_DEFAULT_COORDINATES.LON;
		}

		this.mapCenter = new google.maps.LatLng(this.latitude, this.longitude);
		const options = {
			center: this.mapCenter,
			zoom: this.getMapZoomLevel(),
			streetViewControl: false,
			mapTypeId: 'roadmap',
		}

		this.map = new google.maps.Map(this.mapRef.nativeElement, options);

		var marker = new google.maps.Marker({
			position: this.mapCenter,
			map: this.map,
			icon: SHUTTLE_CONFIG.USER_ICON

		});

		for (var coord in coordinates) {
			let coordinate = coordinates[coord];
			var { busName, lat, lon } = coordinate;

			const location = new google.maps.LatLng(lat, lon);
			this.addBusMarker(location, busName);
		}

		this.showMapRoute();
	}

	//a method to update the location of buses
	updateBusLocations(coordinates) {
		this.refreshMarkers();
		for (var coord in coordinates) {
			let coordinate = coordinates[coord];
			var { busName, lat, lon } = coordinate;

			const location = new google.maps.LatLng(lat, lon);
			this.addBusMarker(location, busName);
		}
		this.showMapRoute();
	}

	//a method to add bus markers to the map
	addBusMarker(location,label) {
		let marker = new google.maps.Marker({
			position: location,
			map: this.map,
			icon: SHUTTLE_CONFIG.BUS_ICON,
			label: label
		});
		var latitude = this.getLatitude();
		var longitude = this.getLongitude();

		var alertCtrl = this.alertCtrl,
			loadingCtrl = this.loadingCtrl;

		this.markers.push(marker);
		marker.addListener('click', function() {
			var busName = marker.getLabel();

			let loader = loadingCtrl.create({
			    content: `Getting Response From Bus ${busName}...`
		    });
		    loader.present();

		    var alertHeader, alertMessage;

			var markerLatitude = marker.getPosition().lat();
			var markerLongitude = marker.getPosition().lng();
			var origin = new google.maps.LatLng(markerLatitude, markerLongitude);
			var userDestination = new google.maps.LatLng(latitude, longitude),
				scienceDestination = new google.maps.LatLng(SHUTTLE_CONFIG.TERMINAL_COORDINATES.SCIENCE_COORDINATES.LAT, SHUTTLE_CONFIG.TERMINAL_COORDINATES.SCIENCE_COORDINATES.LON),
				oldSiteDestination = new google.maps.LatLng(SHUTTLE_CONFIG.TERMINAL_COORDINATES.OLD_SITE_COORDINATES.LAT, SHUTTLE_CONFIG.TERMINAL_COORDINATES.OLD_SITE_COORDINATES.LON),
				srcDestination = new google.maps.LatLng(SHUTTLE_CONFIG.TERMINAL_COORDINATES.SRC_COORDINATES.LAT, SHUTTLE_CONFIG.TERMINAL_COORDINATES.SRC_COORDINATES.LON),
				ayensuDestination = new google.maps.LatLng(SHUTTLE_CONFIG.TERMINAL_COORDINATES.AYENSU_COORDINATES.LAT, SHUTTLE_CONFIG.TERMINAL_COORDINATES.AYENSU_COORDINATES.LON);

			

			var service = new google.maps.DistanceMatrixService;
			service.getDistanceMatrix({
				origins: [origin],
				destinations: [userDestination, scienceDestination, oldSiteDestination,srcDestination, ayensuDestination],
				travelMode: 'DRIVING',
				unitSystem: google.maps.UnitSystem.METRIC,
				avoidHighways: false,
				avoidTolls: false
				}, function(response, status) {
				loader.dismiss();

				if (status !== 'OK') {
					alertHeader = `Could Not Get Response`;
					alertMessage = `
						Please Check Your Internet Connection And Try Again
					`;

					let alert = alertCtrl.create({
					      title: alertHeader,
					      subTitle: alertMessage,
					      buttons: ['OK']
				    });
				    alert.present();
				} else {

					var scienceDistance = response.rows[0].elements[1].distance.text,
						scienceDuration = response.rows[0].elements[1].duration.text,

						oldSiteDistance = response.rows[0].elements[2].distance.text,
						oldSiteDuration = response.rows[0].elements[2].duration.text,

						srcDistance = response.rows[0].elements[3].distance.text,
						srcDuration = response.rows[0].elements[3].duration.text,

						ayensuDistance = response.rows[0].elements[4].distance.text,
						ayensuDuration = response.rows[0].elements[4].duration.text;

					alertHeader = `Response From Bus ${busName}`;
					alertMessage = `
						Distance From Science: <b>${scienceDistance}</b><br>
						ETA To Science: <b>${scienceDuration}</b><br><br>

						Distance From Old Site: <b>${oldSiteDistance}</b><br>
						ETA To Old Site: <b>${oldSiteDuration}</b><br><br>

						Distance From SRC: <b>${srcDistance}</b><br>
						ETA To SRC: <b>${srcDuration}</b><br><br>

						Distance From Ayensu: <b>${ayensuDistance}</b><br>
						ETA To Ayensu: <b>${ayensuDuration}</b>
					`;

					let alert = alertCtrl.create({
					      title: alertHeader,
					      subTitle: alertMessage,
					      buttons: ['OK']
				    });
				    alert.present();
				}
			});
		});

	}

	refreshMarkers() {
		for (var i = 0; i < this.markers.length; i++) {
			this.markers[i].setMap(null);
		}
	}

	//a method to show the routes on the map
	showMapRoute() {
		var directionsService = new google.maps.DirectionsService();
		var directionsDisplay = new google.maps.DirectionsRenderer({suppressMarkers: true});
		  
		directionsDisplay.setMap(this.map);
		var request = {
			origin: new google.maps.LatLng(5.117019, -1.291945),
			destination:new google.maps.LatLng(5.105499, -1.285830),
			travelMode: 'DRIVING',
			waypoints: [
				{
					location: new google.maps.LatLng(SHUTTLE_CONFIG.TERMINAL_COORDINATES.AYENSU_COORDINATES.LAT, SHUTTLE_CONFIG.TERMINAL_COORDINATES.AYENSU_COORDINATES.LON),
					stopover: true
				},
				{
					location: new google.maps.LatLng(SHUTTLE_CONFIG.TERMINAL_COORDINATES.OLD_SITE_COORDINATES.LAT, SHUTTLE_CONFIG.TERMINAL_COORDINATES.OLD_SITE_COORDINATES.LON),
					stopover: true
				},
				{
					location: new google.maps.LatLng(SHUTTLE_CONFIG.TERMINAL_COORDINATES.SRC_COORDINATES.LAT, SHUTTLE_CONFIG.TERMINAL_COORDINATES.SRC_COORDINATES.LON),
					stopover: true
				},
				{
					location: new google.maps.LatLng(SHUTTLE_CONFIG.TERMINAL_COORDINATES.SCIENCE_COORDINATES.LAT, SHUTTLE_CONFIG.TERMINAL_COORDINATES.SCIENCE_COORDINATES.LON),
					stopover: true
				},
				{
					location: new google.maps.LatLng(SHUTTLE_CONFIG.TERMINAL_COORDINATES.VALCO_COORDINATES.LAT, SHUTTLE_CONFIG.TERMINAL_COORDINATES.VALCO_COORDINATES.LON),
					stopover: true
				},

				{
					location: new google.maps.LatLng(SHUTTLE_CONFIG.TERMINAL_COORDINATES.CASFORD_COORDINATES.LAT, SHUTTLE_CONFIG.TERMINAL_COORDINATES.CASFORD_COORDINATES.LON),
					stopover: true
				},
				{
					location: new google.maps.LatLng(SHUTTLE_CONFIG.TERMINAL_COORDINATES.SSNIT_JUNCTION_COORDINATES.LAT, SHUTTLE_CONFIG.TERMINAL_COORDINATES.SSNIT_JUNCTION_COORDINATES.LON),
					stopover: true
				},
				{
					location: new google.maps.LatLng(SHUTTLE_CONFIG.TERMINAL_COORDINATES.GRADUATE_HOSTEL_COORDINATES.LAT, SHUTTLE_CONFIG.TERMINAL_COORDINATES.GRADUATE_HOSTEL_COORDINATES.LON),
					stopover: true
				},
				{
					location: new google.maps.LatLng(SHUTTLE_CONFIG.TERMINAL_COORDINATES.FELT_JUNCTION_COORDINATES.LAT, SHUTTLE_CONFIG.TERMINAL_COORDINATES.FELT_JUNCTION_COORDINATES.LON),
					stopover: true
				}
			]
		};
		directionsService.route(request, function(response, status) {
			if (status == 'OK') {
			  directionsDisplay.setDirections(response);
			} else {
				console.log('error gettig direction display...')
			}
		});
	}

	showBusAtLocation(lat,lon) {
		this.clearCircle();
		this.setMapZoomLevel(17);
		this.mapCenter = new google.maps.LatLng(lat, lon);
		this.map.setZoom(this.getMapZoomLevel());
		this.map.setCenter(this.mapCenter);
		this.radiusCircle = new google.maps.Circle({
            strokeColor: '#00FFFF',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#00FFFF',
            fillOpacity: 0.35,
            map: this.map,
            center: this.mapCenter,
            radius: 60
        });
	}

	clearCircle() {
		if (this.radiusCircle) {
			this.radiusCircle.setMap(null);
		}
	}

	showMapTerminals() {
		let actionSheet = this.actionSheetCtrl.create({
			title: 'View Location...',
			buttons: [
			  {
				text: 'Ayensu',
				handler: () => {
					this.showBusAtLocation(SHUTTLE_CONFIG.TERMINAL_COORDINATES.AYENSU_COORDINATES.LAT, SHUTTLE_CONFIG.TERMINAL_COORDINATES.AYENSU_COORDINATES.LON);
				}
			  },{
				text: 'Casford Hall',
				handler: () => {
					this.showBusAtLocation(SHUTTLE_CONFIG.TERMINAL_COORDINATES.CASFORD_COORDINATES.LAT, SHUTTLE_CONFIG.TERMINAL_COORDINATES.CASFORD_COORDINATES.LON);
				}
			  },
			  {
				text: 'Old Site Terminal',
				handler: () => {
					this.showBusAtLocation(SHUTTLE_CONFIG.TERMINAL_COORDINATES.OLD_SITE_COORDINATES.LAT, SHUTTLE_CONFIG.TERMINAL_COORDINATES.OLD_SITE_COORDINATES.LON);
				}
			  },
			  {
				text: 'Science Terminal',
				handler: () => {
					this.showBusAtLocation(SHUTTLE_CONFIG.TERMINAL_COORDINATES.SCIENCE_COORDINATES.LAT, SHUTTLE_CONFIG.TERMINAL_COORDINATES.SCIENCE_COORDINATES.LON);
				}
			  },
			  {
				text: 'SRC Hostel',
				handler: () => {
					this.showBusAtLocation(SHUTTLE_CONFIG.TERMINAL_COORDINATES.SRC_COORDINATES.LAT, SHUTTLE_CONFIG.TERMINAL_COORDINATES.SRC_COORDINATES.LON);
				}
			  },
			  {
				text: 'Valco Hall',
				handler: () => {
					this.showBusAtLocation(SHUTTLE_CONFIG.TERMINAL_COORDINATES.VALCO_COORDINATES.LAT, SHUTTLE_CONFIG.TERMINAL_COORDINATES.VALCO_COORDINATES.LON);
				}
			  }
			  ,
			  {
				text: 'General Map',
				handler: () => {
					this.showBusesLocations(this.latitude, this.longitude, this.coordinates);
				}
			  }
			  ,{
				text: 'Cancel',
				role: 'cancel',
				handler: () => {
				  console.log('Cancel clicked');
				}
			  }
			]
		});
		actionSheet.present();
	}

	getCoordinateUpdates() {
		let observable = new Observable(observer => {
			this.socket.on('getAllCoordinatesUpdate', (data) => {
			  observer.next(data);
			});
		})
		return observable;
	}

  	//a method to get the coordinates from online
  	requestCoordinates() {
		this.socket.emit('requestAllCoordinates',{'message': 'request coordinates from server'});
	}

	//a method to get the update of coordinates from online
	requestCoordinatesUpdate() {
		setInterval(() => {
			this.socket.emit('requestAllCoordinatesUpdate',{'message': 'request coordinates from server'});
		},5000)
	}
}
