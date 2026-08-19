import CoreLocation
import XCTest
@testable import QiblaAstroIOS

final class NativeBridgeTests: XCTestCase {
    func testLocationPayloadContainsOnlyApprovedFields() throws {
        let location = CLLocation(
            coordinate: CLLocationCoordinate2D(latitude: 30.0444, longitude: 31.2357),
            altitude: 42,
            horizontalAccuracy: 7.5,
            verticalAccuracy: 9,
            timestamp: Date(timeIntervalSince1970: 1_700_000_000)
        )
        let payload = NativeLocationPayload(location: location)
        let object = try NativeBridgeMessage.location(payload).encodeObject()
        XCTAssertEqual(object["type"] as? String, "location")
        let body = try XCTUnwrap(object["payload"] as? [String: Any])
        XCTAssertEqual(Set(body.keys), Set(["latitude", "longitude", "horizontalAccuracy", "timestampMilliseconds"]))
        XCTAssertEqual(body["latitude"] as? Double, 30.0444, accuracy: 0.000001)
        XCTAssertEqual(body["longitude"] as? Double, 31.2357, accuracy: 0.000001)
    }

    @MainActor
    func testLocationStateLabelsAreStable() {
        XCTAssertEqual(WebAppContainer.Coordinator.label(for: .idle), "idle")
        XCTAssertEqual(WebAppContainer.Coordinator.label(for: .requestingAuthorization), "requesting-authorization")
        XCTAssertEqual(WebAppContainer.Coordinator.label(for: .locating), "locating")
        XCTAssertEqual(WebAppContainer.Coordinator.label(for: .denied), "denied")
        XCTAssertEqual(WebAppContainer.Coordinator.label(for: .restricted), "restricted")
        XCTAssertEqual(WebAppContainer.Coordinator.label(for: .failed("x")), "failed:x")
    }
}
