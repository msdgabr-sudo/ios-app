import SwiftUI
import WebKit

struct WebAppContainer: UIViewRepresentable {
    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.websiteDataStore = .default()

        let userContent = WKUserContentController()
        userContent.add(context.coordinator, name: Coordinator.bridgeName)
        userContent.addUserScript(WKUserScript(
            source: Coordinator.bootstrapScript,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        ))
        configuration.userContentController = userContent

        let webView = WKWebView(frame: .zero, configuration: configuration)
        context.coordinator.attach(webView)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.isOpaque = false
        webView.backgroundColor = .black
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.allowsBackForwardNavigationGestures = false

        guard let indexURL = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "WebApp"),
              let webRoot = Bundle.main.url(forResource: "WebApp", withExtension: nil) else {
            assertionFailure("Bundled WebApp/index.html is missing")
            return webView
        }
        webView.loadFileURL(indexURL, allowingReadAccessTo: webRoot)
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    static func dismantleUIView(_ uiView: WKWebView, coordinator: Coordinator) {
        uiView.configuration.userContentController.removeScriptMessageHandler(forName: Coordinator.bridgeName)
        coordinator.detach()
    }

    @MainActor
    final class Coordinator: NSObject, WKScriptMessageHandler, WKNavigationDelegate, WKUIDelegate {
        static let bridgeName = "qiblaNative"
        static let trustedRemoteHost = "app.qiblalabs.com"
        static let bootstrapScript = """
        (function(){
          if (window.QiblaIOSNative) return;
          const post = (action, payload) => {
            try { window.webkit.messageHandlers.qiblaNative.postMessage({action, payload: payload || null}); }
            catch (_) {}
          };
          window.QiblaIOSNative = Object.freeze({
            platform: 'ios',
            requestLocation: () => post('requestLocation'),
            openSettings: () => post('openSettings')
          });
          window.__qiblaReceiveNative = function(message){
            window.dispatchEvent(new CustomEvent('qibla-ios-native', {detail: message}));
          };
        })();
        """

        private weak var webView: WKWebView?
        private let locationService = LocationService()

        override init() {
            super.init()
            locationService.onLocation = { [weak self] location in
                self?.send(.location(NativeLocationPayload(location: location)))
            }
            locationService.onStateChange = { [weak self] state in
                self?.send(.locationState(Self.label(for: state)))
            }
        }

        func attach(_ webView: WKWebView) { self.webView = webView }
        func detach() { webView = nil }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.name == Self.bridgeName,
                  let body = message.body as? [String: Any],
                  let action = body["action"] as? String else { return }
            switch action {
            case "requestLocation":
                locationService.requestSingleTrustedFix()
            case "openSettings":
                guard let url = URL(string: UIApplication.openSettingsURLString) else { return }
                UIApplication.shared.open(url)
            default:
                break
            }
        }

        private func send(_ message: NativeBridgeMessage) {
            guard let webView else { return }
            do {
                let object = try message.encodeObject()
                let data = try JSONSerialization.data(withJSONObject: object)
                guard let json = String(data: data, encoding: .utf8) else { return }
                webView.evaluateJavaScript("window.__qiblaReceiveNative && window.__qiblaReceiveNative(\(json));")
            } catch {
                assertionFailure("Failed to encode native bridge payload: \(error)")
            }
        }

        static func label(for state: LocationService.State) -> String {
            switch state {
            case .idle: return "idle"
            case .requestingAuthorization: return "requesting-authorization"
            case .locating: return "locating"
            case .denied: return "denied"
            case .restricted: return "restricted"
            case .failed(let reason): return "failed:\(reason)"
            }
        }

        private static func isTrusted(_ origin: WKSecurityOrigin) -> Bool {
            origin.host.isEmpty || origin.host == trustedRemoteHost
        }

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = navigationAction.request.url else {
                decisionHandler(.cancel)
                return
            }
            if url.isFileURL || url.host == Self.trustedRemoteHost {
                decisionHandler(.allow)
                return
            }
            if navigationAction.navigationType == .linkActivated,
               let scheme = url.scheme?.lowercased(), ["https", "http"].contains(scheme) {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.cancel)
        }

        @available(iOS 15.0, *)
        func webView(_ webView: WKWebView,
                     requestMediaCapturePermissionFor origin: WKSecurityOrigin,
                     initiatedByFrame frame: WKFrameInfo,
                     type: WKMediaCaptureType,
                     decisionHandler: @escaping (WKPermissionDecision) -> Void) {
            decisionHandler(Self.isTrusted(origin) ? .prompt : .deny)
        }

        @available(iOS 15.0, *)
        func webView(_ webView: WKWebView,
                     requestDeviceOrientationAndMotionPermissionFor origin: WKSecurityOrigin,
                     initiatedByFrame frame: WKFrameInfo,
                     decisionHandler: @escaping (WKPermissionDecision) -> Void) {
            decisionHandler(Self.isTrusted(origin) ? .prompt : .deny)
        }
    }
}
