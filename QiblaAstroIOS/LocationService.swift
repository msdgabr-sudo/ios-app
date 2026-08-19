import CoreLocation

@MainActor
final class LocationService: NSObject, @preconcurrency CLLocationManagerDelegate {
    enum LocationError: Error {
        case servicesDisabled
        case denied
        case restricted
        case reducedAccuracy
        case unavailable
        case timedOut
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
    private var timeoutTask: Task<Void, Never>?

    private static let maximumAcceptedAge: TimeInterval = 30
    private static let requestTimeoutNanoseconds: UInt64 = 15_000_000_000

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
        manager.distanceFilter = kCLDistanceFilterNone
        manager.activityType = .otherNavigation
        manager.pausesLocationUpdatesAutomatically = false
    }

    func requestCurrentLocation(completion: @escaping (Result<Sample, LocationError>) -> Void) {
        guard pendingCompletion == nil else {
            completion(.failure(.unavailable))
            return
        }
        guard CLLocationManager.locationServicesEnabled() else {
            completion(.failure(.servicesDisabled))
            return
        }

        pendingCompletion = completion
        switch manager.authorizationStatus {
        case .notDetermined:
            manager.requestWhenInUseAuthorization()
        case .authorizedWhenInUse, .authorizedAlways:
            beginLocationAcquisition()
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
            beginLocationAcquisition()
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
        guard pendingCompletion != nil else { return }
        guard manager.accuracyAuthorization == .fullAccuracy else {
            finish(.failure(.reducedAccuracy))
            return
        }

        let now = Date()
        let candidates = locations.filter { location in
            location.horizontalAccuracy >= 0 &&
            location.coordinate.latitude.isFinite &&
            location.coordinate.longitude.isFinite &&
            abs(location.timestamp.timeIntervalSince(now)) <= Self.maximumAcceptedAge
        }

        guard let location = candidates.min(by: { $0.horizontalAccuracy < $1.horizontalAccuracy }) else {
            return
        }

        let sample = Sample(
            latitude: location.coordinate.latitude,
            longitude: location.coordinate.longitude,
            altitude: location.altitude,
            horizontalAccuracy: location.horizontalAccuracy,
            verticalAccuracy: location.verticalAccuracy,
            timestamp: location.timestamp,
            fullAccuracy: true
        )
        finish(.success(sample))
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        guard pendingCompletion != nil else { return }
        if let clError = error as? CLError {
            switch clError.code {
            case .denied:
                finish(.failure(.denied))
            case .locationUnknown:
                return
            default:
                finish(.failure(.unavailable))
            }
        } else {
            finish(.failure(.unavailable))
        }
    }

    private func beginLocationAcquisition() {
        guard pendingCompletion != nil else { return }
        guard manager.accuracyAuthorization == .fullAccuracy else {
            finish(.failure(.reducedAccuracy))
            return
        }

        timeoutTask?.cancel()
        timeoutTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: Self.requestTimeoutNanoseconds)
            guard !Task.isCancelled else { return }
            await MainActor.run {
                guard let self, self.pendingCompletion != nil else { return }
                self.finish(.failure(.timedOut))
            }
        }
        manager.startUpdatingLocation()
    }

    private func finish(_ result: Result<Sample, LocationError>) {
        manager.stopUpdatingLocation()
        timeoutTask?.cancel()
        timeoutTask = nil
        let completion = pendingCompletion
        pendingCompletion = nil
        completion?(result)
    }

    deinit {
        timeoutTask?.cancel()
        manager.stopUpdatingLocation()
    }
}
