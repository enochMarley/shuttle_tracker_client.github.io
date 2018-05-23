import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Socket } from 'ng-socket-io';
import { Observable } from 'rxjs/Observable';
import { GESTURE_PRIORITY_TOGGLE } from 'ionic-angular/gestures/gesture-controller';

declare var google: any;

@Component({
  	selector: 'page-home',
  	templateUrl: 'home.html'
})
export class HomePage {
	@ViewChild('map') mapRef: ElementRef;
	map: any;
  	constructor(public navCtrl: NavController, public socket: Socket) {
		this.getCoordinates().subscribe(message => {
			console.log(message)
		});
  	}

  	//when the page loads completely
  	ionViewDidLoad() {
		this.requestCoordinates();
		this.showMap();
	}

	showMap() {
		const location = new google.maps.LatLng(150.644, -34.397);

		const options = {
			center: location,
			zoom: 10,
			streetViewControl: false,
			mapTypeId: 'roadmap'
		}

		this.map = new google.maps.Map(this.mapRef.nativeElement, options);

		this.addMarker(location, this.map);
	}

	addMarker(position, map) {
		return new google.maps.Marker({
			position,
			map
		})
	}

	  
	getCoordinates() {
		let observable = new Observable(observer => {
			this.socket.on('getAllCoordinates', (data) => {
			  observer.next(data);
			});
		})
		return observable;
	}

	getCoordinatesRegularly() {
		setInterval(() => {
			this.getCoordinates();
		}, 100000);
	}
  	//a method to get the coordinates from online
  	requestCoordinates() {
		  this.socket.emit('requestAllCoordinates',{'message': 'request coordinates from server'});
		  console.log('hello')
  	}

}
