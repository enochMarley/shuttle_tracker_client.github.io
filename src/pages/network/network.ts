import { Network } from '@ionic-native/network';
import { HomePage } from './../home/home';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

/**
 * Generated class for the NetworkPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-network',
  templateUrl: 'network.html',
})
export class NetworkPage {

	constructor(public navCtrl: NavController, public navParams: NavParams,private network: Network) {
	}

	ionViewDidEnter() {
		this.network.onConnect().subscribe(data => {
			this.gotoHomePage();
		}, error => {
			console.error(error)
		})

		this.network.onDisconnect().subscribe(data => {
			console.log(data)
		}, error => {
			console.error(error)
		})
	}

	ionViewDidLoad() {
		console.log('ionViewDidLoad NetworkPage');
	}

	gotoHomePage() {
		this.navCtrl.push(HomePage)
	}

}
