import Foundation
import WebKit

@MainActor
final class NativeBridge: NSObject, WKScriptMessageHandler {
    static let locationHandlerName = "qiblaLocation"
    static let headingHandlerName = "qiblaHeading"

    private weak var webView: WKWebView?
    private let locationService = LocationService()
    private let headingService = HeadingService()

    func attach(to webView: WKWebView) {
        self.webView = webView
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame,
              let body = message.body as? [String: Any],
              let action = body["action"] as? String else {
            return
        }

        switch message.name {
        case Self.locationHandlerName:
            handleLocation(action: action, body: body)
        case Self.headingHandlerName:
            handleHeading(action: action)
        default:
            return
        }
    }

    private func handleLocation(action: String, body: [String: Any]) {
        guard action == "requestCurrent",
              let requestID = body["requestId"] as? String,
              !requestID.isEmpty,
              requestID.count <= 80 else {
            return
        }

        locationService.requestCurrentLocation { [weak self] result in
            guard let self else { return }
            switch result {
            case .success(let sample):
                self.send([
                    "type": "location",
                    "requestId": requestID,
                    "ok": true,
                    "source": "core-location",
                    "coords": [
                        "latitude": sample.latitude,
                        "longitude": sample.longitude,
                        "altitude": sample.altitude,
                        "accuracy": sample.horizontalAccuracy,
                        "altitudeAccuracy": sample.verticalAccuracy
                    ],
                    "timestamp": sample.timestamp.timeIntervalSince1970 * 1000.0,
                    "fullAccuracy": sample.fullAccuracy
                ])
            case .failure(let error):
                self.send([
                    "type": "location",
                    "requestId": requestID,
                    "ok": false,
                    "source": "core-location",
                    "error": self.locationErrorCode(error)
                ])
            }
        }
    }

    private func handleHeading(action: String) {
        switch action {
        case "start":
            headingService.start { [weak self] result in
                guard let self else { return }
                switch result {
                case .success(let sample):
                    self.send([
                        "type": "heading",
                        "ok": true,
                        "source": "core-location-magnetic",
                        "magneticHeading": sample.magneticHeading,
                        "accuracy": sample.accuracy,
                        "timestamp": sample.timestamp.timeIntervalSince1970 * 1000.0
                    ])
                case .failure(let error):
                    self.send([
                        "type": "heading",
                        "ok": false,
                        "source": "core-location-magnetic",
                        "error": self.headingErrorCode(error)
                    ])
                }
            }
        case "stop":
            headingService.stop()
        default:
            return
        }
    }

    private func locationErrorCode(_ error: LocationService.LocationError) -> String {
        switch error {
        case .servicesDisabled: return "services-disabled"
        case .denied: return "denied"
        case .restricted: return "restricted"
        case .reducedAccuracy: return "reduced-accuracy"
        case .unavailable: return "unavailable"
        case .timedOut: return "timeout"
        }
    }

    private func headingErrorCode(_ error: HeadingService.HeadingError) -> String {
        switch error {
        case .servicesDisabled: return "services-disabled"
        case .denied: return "denied"
        case .restricted: return "restricted"
        case .unavailable: return "unavailable"
        }
    }

    private func send(_ payload: [String: Any]) {
        guard JSONSerialization.isValidJSONObject(payload),
              let data = try? JSONSerialization.data(withJSONObject: payload),
              let json = String(data: data, encoding: .utf8) else {
            return
        }

        let script = "window.QiblaIOSNative&&window.QiblaIOSNative._receive(\(json));"
        webView?.evaluateJavaScript(script)
    }
}
