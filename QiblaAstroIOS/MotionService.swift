import CoreMotion

@MainActor
final class MotionService {
    enum MotionError: Error {
        case unavailable
        case referenceFrameUnavailable
    }

    struct Sample {
        let roll: Double
        let pitch: Double
        let yaw: Double
        let quaternionX: Double
        let quaternionY: Double
        let quaternionZ: Double
        let quaternionW: Double
        let gravityX: Double
        let gravityY: Double
        let gravityZ: Double
        let rotationRateX: Double
        let rotationRateY: Double
        let rotationRateZ: Double
        let userAccelerationX: Double
        let userAccelerationY: Double
        let userAccelerationZ: Double
        let sensorUptime: TimeInterval
        let receivedAt: Date
    }

    private let manager = CMMotionManager()
    private let queue: OperationQueue = {
        let queue = OperationQueue()
        queue.name = "com.qiblalabs.qiblaastro.motion"
        queue.qualityOfService = .userInteractive
        queue.maxConcurrentOperationCount = 1
        return queue
    }()

    private(set) var isRunning = false

    init() {
        manager.deviceMotionUpdateInterval = 1.0 / 30.0
        manager.showsDeviceMovementDisplay = true
    }

    func start(updateHandler: @escaping (Result<Sample, MotionError>) -> Void) {
        guard manager.isDeviceMotionAvailable else {
            updateHandler(.failure(.unavailable))
            return
        }

        let availableFrames = CMMotionManager.availableAttitudeReferenceFrames()
        guard availableFrames.contains(.xMagneticNorthZVertical) else {
            updateHandler(.failure(.referenceFrameUnavailable))
            return
        }

        guard !isRunning else { return }
        isRunning = true

        manager.startDeviceMotionUpdates(using: .xMagneticNorthZVertical, to: queue) { [weak self] motion, error in
            guard let self else { return }
            guard self.isRunning else { return }

            if error != nil {
                Task { @MainActor in
                    updateHandler(.failure(.unavailable))
                }
                return
            }

            guard let motion else { return }
            let attitude = motion.attitude
            let quaternion = attitude.quaternion
            let gravity = motion.gravity
            let rotationRate = motion.rotationRate
            let userAcceleration = motion.userAcceleration

            let values = [
                attitude.roll, attitude.pitch, attitude.yaw,
                quaternion.x, quaternion.y, quaternion.z, quaternion.w,
                gravity.x, gravity.y, gravity.z,
                rotationRate.x, rotationRate.y, rotationRate.z,
                userAcceleration.x, userAcceleration.y, userAcceleration.z,
                motion.timestamp
            ]
            guard values.allSatisfy({ $0.isFinite }) else { return }

            let sample = Sample(
                roll: attitude.roll,
                pitch: attitude.pitch,
                yaw: attitude.yaw,
                quaternionX: quaternion.x,
                quaternionY: quaternion.y,
                quaternionZ: quaternion.z,
                quaternionW: quaternion.w,
                gravityX: gravity.x,
                gravityY: gravity.y,
                gravityZ: gravity.z,
                rotationRateX: rotationRate.x,
                rotationRateY: rotationRate.y,
                rotationRateZ: rotationRate.z,
                userAccelerationX: userAcceleration.x,
                userAccelerationY: userAcceleration.y,
                userAccelerationZ: userAcceleration.z,
                sensorUptime: motion.timestamp,
                receivedAt: Date()
            )

            Task { @MainActor in
                updateHandler(.success(sample))
            }
        }
    }

    func stop() {
        guard isRunning else { return }
        manager.stopDeviceMotionUpdates()
        isRunning = false
    }

    deinit {
        manager.stopDeviceMotionUpdates()
    }
}
