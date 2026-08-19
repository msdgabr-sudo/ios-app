import CoreLocation

@MainActor
final class HeadingService: NSObject, CLLocationManagerDelegate {
    enum HeadingError: Error {
        case servicesDisabled
        case denied
        case restricted
        case unavailable
    }

    struct Sample {
        let magneticHeading: Double
        let accuracy: Double
        let timestamp: Date
    }

    private let manager = CLLocationManager()
    private var updateHandler: ((Result<Sample, HeadingError>) -> Void)?
    private(set) var isRunning = false

    override init() {
        super.init()
        manager.delegate = self
        manager.headingFilter = 1.0
    }

    func start(updateHandler: @escaping (Result<Sample, HeadingError>) -> Void) {
        guard CLLocationManager.locationServicesEnabled() else {
            updateHandler(.failure(.servicesDisabled))
            return
        }
        guard CLLocationManager.headingAvailable() else {
            updateHandler(.failure(.unavailable))
            return
        }

        switch manager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            self.updateHandler = updateHandler
            isRunning = true
            manager.startUpdatingHeading()
        case .denied:
            updateHandler(.failure(.denied))
        case .restricted:
            updateHandler(.failure(.restricted))
        case .notDetermined:
            // Location permission belongs to the location flow. Heading must not
            // create a second, surprising permission request.
            updateHandler(.failure(.denied))
        @unknown default:
            updateHandler(.failure(.unavailable))
        }
    }

    func stop() {
        guard isRunning else { return }
        manager.stopUpdatingHeading()
        isRunning = false
        updateHandler = nil
    }

    func locationManager(_ manager: CLLocationManager, didUpdateHeading newHeading: CLHeading) {
        guard isRunning else { return }
        guard newHeading.headingAccuracy >= 0,
              newHeading.magneticHeading.isFinite,
              newHeading.headingAccuracy.isFinite else {
            return
        }

        let normalized = newHeading.magneticHeading.truncatingRemainder(dividingBy: 360) +
            (newHeading.magneticHeading < 0 ? 360 : 0)
        updateHandler?(.success(Sample(
            magneticHeading: normalized,
            accuracy: newHeading.headingAccuracy,
            timestamp: newHeading.timestamp
        )))
    }

    func locationManagerShouldDisplayHeadingCalibration(_ manager: CLLocationManager) -> Bool {
        true
    }

    deinit {
        manager.stopUpdatingHeading()
    }
}
