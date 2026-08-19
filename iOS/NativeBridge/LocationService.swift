import CoreLocation
import Foundation

@MainActor
final class LocationService: NSObject, CLLocationManagerDelegate {
    enum State: Equatable {
        case idle
        case requestingAuthorization
        case locating
        case denied
        case restricted
        case failed(String)
    }

    private let manager = CLLocationManager()
    private(set) var state: State = .idle
    var onLocation: ((CLLocation) -> Void)?
    var onStateChange: ((State) -> Void)?

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
        manager.distanceFilter = kCLDistanceFilterNone
    }

    func requestSingleTrustedFix() {
        guard CLLocationManager.locationServicesEnabled() else {
            setState(.denied)
            return
        }

        switch manager.authorizationStatus {
        case .notDetermined:
            setState(.requestingAuthorization)
            manager.requestWhenInUseAuthorization()
        case .authorizedWhenInUse, .authorizedAlways:
            beginSingleFix()
        case .denied:
            setState(.denied)
        case .restricted:
            setState(.restricted)
        @unknown default:
            setState(.failed("unknown-authorization"))
        }
    }

    private func beginSingleFix() {
        setState(.locating)
        manager.requestLocation()
    }

    private func setState(_ newState: State) {
        state = newState
        onStateChange?(newState)
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        switch manager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            beginSingleFix()
        case .denied:
            setState(.denied)
        case .restricted:
            setState(.restricted)
        case .notDetermined:
            break
        @unknown default:
            setState(.failed("unknown-authorization"))
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else {
            setState(.failed("empty-location"))
            return
        }
        guard location.horizontalAccuracy >= 0 else {
            setState(.failed("invalid-accuracy"))
            return
        }
        onLocation?(location)
        setState(.idle)
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        let nsError = error as NSError
        if nsError.domain == kCLErrorDomain, nsError.code == CLError.denied.rawValue {
            setState(.denied)
            return
        }
        setState(.failed("core-location-\(nsError.code)"))
    }
}
