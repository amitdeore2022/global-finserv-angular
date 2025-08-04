import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getDatabase, provideDatabase } from '@angular/fire/database';

import { importProvidersFrom, isDevMode } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideServiceWorker } from '@angular/service-worker'; // ✅ Add this

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom(FormsModule), // ✅ Include this line
    provideFirebaseApp(() =>
      initializeApp({
        apiKey: "AIzaSyD00RkPgtzB4eUSm0myL5aHAvW_zhb5pJA",
        authDomain: "global-financial-service-346f9.firebaseapp.com",
        projectId: "global-financial-service-346f9",
        storageBucket: "global-financial-service-346f9.firebasestorage.app",
        messagingSenderId: "408507363440",
        appId: "1:408507363440:web:d3a629d1da9646dcc404b5",
        measurementId: "G-S04YF9S6H5"
      })
    ),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideDatabase(() => getDatabase()), provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          }),
  ],
};
