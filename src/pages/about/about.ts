import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { SHUTTLE_CONFIG } from './../../app/shuttle.config';


@IonicPage()
@Component({
  selector: 'page-about',
  templateUrl: 'about.html',
})
export class AboutPage {
	busImg;
	userImg;
	busStopImg;

	constructor(public navCtrl: NavController, public navParams: NavParams) {
		this.busImg = SHUTTLE_CONFIG.BUS_ICON;
		this.userImg = SHUTTLE_CONFIG.USER_ICON;
		this.busStopImg = SHUTTLE_CONFIG.BUS_STOP_ICON;
	}

	ionViewDidLoad() {
	    console.log('ionViewDidLoad AboutPage');
	}

}
