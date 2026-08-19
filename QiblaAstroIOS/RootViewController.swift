import UIKit
import WebKit

@MainActor
final class RootViewController: UIViewController, WKNavigationDelegate, WKUIDelegate {
    private let bridge = NativeBridge()
    private lazy var webView: WKWebView = makeWebView()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 5.0 / 255.0, green: 8.0 / 255.0, blue: 15.0 / 255.0, alpha: 1)
        configureLayout()
        loadBundledApplication()
    }

    private func makeWebView() -> WKWebView {
        let controller = WKUserContentController()
        controller.add(bridge, name: NativeBridge.locationHandlerName)
        controller.add(bridge, name: NativeBridge.headingHandlerName)
        controller.addUserScript(WKUserScript(
            source: Self.bootstrapScript,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        ))

        let configuration = WKWebViewConfiguration()
        configuration.userContentController = controller
        configuration.websiteDataStore = .default()
        configuration.allowsInlineMediaPlayback = true
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = false

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.showsVerticalScrollIndicator = false
        webView.scrollView.showsHorizontalScrollIndicator = false
        webView.allowsBackForwardNavigationGestures = false
        bridge.attach(to: webView)
        return webView
    }

    private func configureLayout() {
        webView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }

    private func loadBundledApplication() {
        guard let webRoot = Bundle.main.resourceURL?.appendingPathComponent("WebApp", isDirectory: true),
              let indexURL = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "WebApp") else {
            assertionFailure("Bundled WebApp/index.html is missing")
            return
        }
        webView.loadFileURL(indexURL, allowingReadAccessTo: webRoot)
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction) async -> WKNavigationActionPolicy {
        guard let url = navigationAction.request.url else { return .cancel }

        if url.isFileURL { return .allow }

        if let scheme = url.scheme?.lowercased(), scheme == "about" || scheme == "data" || scheme == "blob" {
            return .allow
        }

        if navigationAction.targetFrame?.isMainFrame == true {
            if url.scheme == "https", url.host == "app.qiblalabs.com" {
                return .allow
            }
            if ["https", "http", "mailto", "tel"].contains(url.scheme?.lowercased() ?? "") {
                await MainActor.run { UIApplication.shared.open(url) }
                return .cancel
            }
        }

        return .allow
    }

    deinit {
        let controller = webView.configuration.userContentController
        controller.removeScriptMessageHandler(forName: NativeBridge.locationHandlerName)
        controller.removeScriptMessageHandler(forName: NativeBridge.headingHandlerName)
    }

    private static let bootstrapScript = #"""
    (function(){
      'use strict';
      if(window.QiblaIOSNative) return;
      var pending = Object.create(null);
      var headingRunning = false;

      window.QiblaIOSNative = {
        platform: 'ios',
        requestLocation: function(){
          return new Promise(function(resolve,reject){
            var requestId = 'loc-' + Date.now() + '-' + Math.random().toString(36).slice(2);
            pending[requestId] = {resolve:resolve,reject:reject};
            try {
              window.webkit.messageHandlers.qiblaLocation.postMessage({action:'requestCurrent',requestId:requestId});
            } catch (error) {
              delete pending[requestId];
              reject({code:'bridge-unavailable'});
            }
          });
        },
        startHeading: function(){
          if(headingRunning) return true;
          try {
            window.webkit.messageHandlers.qiblaHeading.postMessage({action:'start'});
            headingRunning = true;
            return true;
          } catch (error) {
            headingRunning = false;
            return false;
          }
        },
        stopHeading: function(){
          if(!headingRunning) return;
          try { window.webkit.messageHandlers.qiblaHeading.postMessage({action:'stop'}); } catch (error) {}
          headingRunning = false;
        },
        _receive: function(message){
          if(!message || !message.type) return;
          if(message.type === 'location' && message.requestId){
            var slot = pending[message.requestId];
            if(!slot) return;
            delete pending[message.requestId];
            if(message.ok) slot.resolve(message);
            else slot.reject({code:message.error || 'unavailable'});
            return;
          }
          if(message.type === 'heading'){
            if(message.ok){
              window.dispatchEvent(new CustomEvent('qibla-ios-heading', {detail:message}));
            } else {
              headingRunning = false;
              window.dispatchEvent(new CustomEvent('qibla-ios-heading-error', {detail:message}));
            }
          }
        }
      };
      window.dispatchEvent(new CustomEvent('qibla-ios-native-ready'));
    })();
    """#
}
