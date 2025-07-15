import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getDatabase, provideDatabase } from '@angular/fire/database';

import { importProvidersFrom } from '@angular/core';
import { FormsModule } from '@angular/forms'; // ✅ Add this

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom(FormsModule), // ✅ Include this line
    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'global-finserve',
        appId: '1:651361387611:web:cbeb371e072814159d2b7e',
        storageBucket: 'global-finserve.firebasestorage.app',
        apiKey: 'AIzaSyASNag2dfCxlhKsMM2QkJQ5EqX-DvxYcko',
        authDomain: 'global-finserve.firebaseapp.com',
        messagingSenderId: '651361387611',
      })
    ),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideDatabase(() => getDatabase()),
  ],
};
