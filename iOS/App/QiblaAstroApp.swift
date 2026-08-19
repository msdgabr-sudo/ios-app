import SwiftUI

@main
struct QiblaAstroApp: App {
    var body: some Scene {
        WindowGroup {
            WebAppContainer()
                .ignoresSafeArea()
        }
    }
}
