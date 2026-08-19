import CoreLocation
import Foundation

struct NativeLocationPayload: Codable, Equatable {
    let latitude: Double
    let longitude: Double
    let horizontalAccuracy: Double
    let timestampMilliseconds: Int64

    init(location: CLLocation) {
        latitude = location.coordinate.latitude
        longitude = location.coordinate.longitude
        horizontalAccuracy = location.horizontalAccuracy
        timestampMilliseconds = Int64(location.timestamp.timeIntervalSince1970 * 1000)
    }
}

enum NativeBridgeMessage: Codable, Equatable {
    case location(NativeLocationPayload)
    case locationState(String)

    private enum CodingKeys: String, CodingKey { case type, payload }
    private enum MessageType: String, Codable { case location, locationState }

    func encodeObject() throws -> [String: Any] {
        let data = try JSONEncoder().encode(self)
        let object = try JSONSerialization.jsonObject(with: data)
        guard let dictionary = object as? [String: Any] else {
            throw NSError(domain: "QiblaAstro.NativeBridge", code: 1)
        }
        return dictionary
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        switch try container.decode(MessageType.self, forKey: .type) {
        case .location:
            self = .location(try container.decode(NativeLocationPayload.self, forKey: .payload))
        case .locationState:
            self = .locationState(try container.decode(String.self, forKey: .payload))
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        switch self {
        case .location(let payload):
            try container.encode(MessageType.location, forKey: .type)
            try container.encode(payload, forKey: .payload)
        case .locationState(let payload):
            try container.encode(MessageType.locationState, forKey: .type)
            try container.encode(payload, forKey: .payload)
        }
    }
}
