import CoreLocation

@MainActor
final class LocationService: NSObject, CLLocationManagerDelegate {
    enum LocationError: Error {
        case servicesDisabled
        case denied
        case restricted
        case unavailable
    }

    struct Sample {
        let latitude: Double
        let longitude: Double
        let altitude: Double
        let horizontalAccuracy: Double
        let verticalAccuracy: Double
        let timestamp: Date
        let fullAccuracy: Bool
    }

    private let manager = CLLocationManager()
    private var pendingCompletion: ((Result<Sample, LocationError>) -> Void)?

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
        manager.distanceFilter = kCLDistanceFilterNone
        manager.activityType = .otherNavigation
        manager.pausesLocationUpdatesAutomatically = false
    }

    func requestCurrentLocation(completion: @escaping (Result<Sample, LocationError>) -> Void) {
        guard CLLocationManager.locationServicesEnabled() else {
            completion(.failure(.servicesDisabled))
            return
        }

        pendingCompletion = completion
        switch manager.authorizationStatus {
        case .notDetermined:
            manager.requestWhenInUseAuthorization()
        case .authorizedWhenInUse, .authorizedAlways:
            manager.requestLocation()
        case .denied:
            finish(.failure(.denied))
        case .restricted:
            finish(.failure(.restricted))
        @unknown default:
            finish(.failure(.unavailable))
        }
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        guard pendingCompletion != nil else { return }
        switch manager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            manager.requestLocation()
        case .denied:
            finish(.failure(.denied))
        case .restricted:
            finish(.failure(.restricted))
        case .notDetermined:
            break
        @unknown default:
            finish(.failure(.unavailable))
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else {
            finish(.failure(.unavailable))
            return
        }

        let sample = Sample(
            latitude: location.coordinate.latitude,
            longitude: location.coordinate.longitude,
            altitude: location.altitude,
            horizontalAccuracy: location.horizontalAccuracy,
            verticalAccuracy: location.verticalAccuracy,
            timestamp: location.timestamp,
            fullAccuracy: manager.accuracyAuthorization == .fullAccuracy
        )
        finish(.success(sample))
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        if let clError = error as? CLError, clError.code == .denied {
            finish(.failure(.denied))
        } else {
            finish(.failure(.unavailable))
        }
    }

    private func finish(_ result: Result<Sample, LocationError>) {
        let completion = pendingCompletion
        pendingCompletion = nil
        completion?(result)
    }
}
