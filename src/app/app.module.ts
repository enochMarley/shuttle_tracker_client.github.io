import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { AboutPage } from '../pages/about/about';
import { NetworkPage } from '../pages/network/network';
import { IntroPage } from '../pages/intro/intro';


import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { SocketIoModule, SocketIoConfig } from 'ng-socket-io';
import { Geolocation }  from '@ionic-native/geolocation';
import { Network } from '@ionic-native/network'
 
let config: SocketIoConfig = { url: 'https://shuttle-tracker-api.herokuapp.com', options: {} };

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    NetworkPage,
    AboutPage,
    IntroPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    SocketIoModule.forRoot(config) 
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    NetworkPage,
    AboutPage,
    IntroPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    Geolocation,
    Network
  ]
})
export class AppModule {}
