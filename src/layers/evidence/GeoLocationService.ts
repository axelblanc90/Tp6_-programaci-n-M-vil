import { GeoLocationData } from '../../types/installation.types.ts';

export class GeoLocationService {
  static async getCurrentLocation(): Promise<GeoLocationData> {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              latitude: Number(pos.coords.latitude.toFixed(6)),
              longitude: Number(pos.coords.longitude.toFixed(6)),
              accuracy: Math.round(pos.coords.accuracy),
              altitude: pos.coords.altitude ? Math.round(pos.coords.altitude) : null,
              timestamp: new Date().toISOString(),
            });
          },
          () => {
            resolve(this.getFallbackCoordinates());
          },
          { timeout: 4000, enableHighAccuracy: true }
        );
      });
    }

    return this.getFallbackCoordinates();
  }

  private static getFallbackCoordinates(): GeoLocationData {
    // Coordenadas de campo en Concepción del Uruguay (Sede FCyT)
    return {
      latitude: -32.484512,
      longitude: -58.232984,
      accuracy: 4,
      altitude: 28,
      timestamp: new Date().toISOString(),
    };
  }
}
