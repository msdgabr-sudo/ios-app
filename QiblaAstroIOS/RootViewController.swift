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
        observeApplicationLifecycle()
        loadBundledApplication()
    }

    private func makeWebView() -> WKWebView {
        let controller = WKUserContentController()
        controller.add(bridge, name: NativeBridge.locationHandlerName)
        controller.add(bridge, name: NativeBridge.headingHandlerName)
        controller.add(bridge, name: NativeBridge.motionHandlerName)
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

    private func observeApplicationLifecycle() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(applicationDidEnterBackground),
            name: UIApplication.didEnterBackgroundNotification,
            object: nil
        )
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(applicationWillTerminate),
            name: UIApplication.willTerminateNotification,
            object: nil
        )
    }

    @objc private func applicationDidEnterBackground() {
        bridge.stopTransientSensors()
    }

    @objc private func applicationWillTerminate() {
        bridge.stopTransientSensors()
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

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        bridge.stopTransientSensors()
        loadBundledApplication()
    }

    deinit {
        bridge.stopTransientSensors()
        NotificationCenter.default.removeObserver(self)
        let controller = webView.configuration.userContentController
        controller.removeScriptMessageHandler(forName: NativeBridge.locationHandlerName)
        controller.removeScriptMessageHandler(forName: NativeBridge.headingHandlerName)
        controller.removeScriptMessageHandler(forName: NativeBridge.motionHandlerName)
    }

    private static let bootstrapScript = #"""
    (function(){
      'use strict';
      if(window.QiblaIOSNative) return;
      var pending = Object.create(null);
      var headingRunning = false;
      var motionRunning = false;
      var latestHeading = null;
      var latestMotion = null;
      var maximumFusionAgeMs = 1000;

      function finiteNumber(value){
        return typeof value === 'number' && Number.isFinite(value);
      }

      function fresh(message){
        return message && finiteNumber(message.timestamp) && Math.abs(Date.now() - message.timestamp) <= maximumFusionAgeMs;
      }

      function emitOrientationIfReady(){
        if(!fresh(latestHeading) || !fresh(latestMotion)) return;
        if(latestHeading.source !== 'core-location-magnetic') return;
        if(latestMotion.source !== 'core-motion-magnetic-north') return;
        if(latestMotion.referenceFrame !== 'xMagneticNorthZVertical') return;
        if(!finiteNumber(latestHeading.magneticHeading) || latestHeading.magneticHeading < 0 || latestHeading.magneticHeading >= 360) return;
        if(!finiteNumber(latestHeading.accuracy) || latestHeading.accuracy < 0) return;
        if(!latestMotion.attitude || !latestMotion.attitude.quaternion || !latestMotion.gravity) return;

        window.dispatchEvent(new CustomEvent('qibla-ios-orientation', {detail:{
          source: 'ios-native-sensors',
          referenceFrame: 'xMagneticNorthZVertical',
          magneticHeading: latestHeading.magneticHeading,
          headingAccuracy: latestHeading.accuracy,
          headingTimestamp: latestHeading.timestamp,
          motionTimestamp: latestMotion.timestamp,
          attitude: latestMotion.attitude,
          gravity: latestMotion.gravity,
          rotationRate: latestMotion.rotationRate,
          userAcceleration: latestMotion.userAcceleration,
          sensorUptime: latestMotion.sensorUptime
        }}));
      }

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
          latestHeading = null;
        },
        startMotion: function(){
          if(motionRunning) return true;
          try {
            window.webkit.messageHandlers.qiblaMotion.postMessage({action:'start'});
            motionRunning = true;
            return true;
          } catch (error) {
            motionRunning = false;
            return false;
          }
        },
        stopMotion: function(){
          if(!motionRunning) return;
          try { window.webkit.messageHandlers.qiblaMotion.postMessage({action:'stop'}); } catch (error) {}
          motionRunning = false;
          latestMotion = null;
        },
        startOrientation: function(){
          var headingStarted = this.startHeading();
          var motionStarted = this.startMotion();
          return headingStarted && motionStarted;
        },
        stopOrientation: function(){
          this.stopHeading();
          this.stopMotion();
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
              latestHeading = message;
              window.dispatchEvent(new CustomEvent('qibla-ios-heading', {detail:message}));
              emitOrientationIfReady();
            } else {
              headingRunning = false;
              latestHeading = null;
              window.dispatchEvent(new CustomEvent('qibla-ios-heading-error', {detail:message}));
            }
            return;
          }
          if(message.type === 'motion'){
            if(message.ok){
              latestMotion = message;
              window.dispatchEvent(new CustomEvent('qibla-ios-motion', {detail:message}));
              emitOrientationIfReady();
            } else {
              motionRunning = false;
              latestMotion = null;
              window.dispatchEvent(new CustomEvent('qibla-ios-motion-error', {detail:message}));
            }
          }
        }
      };
      window.dispatchEvent(new CustomEvent('qibla-ios-native-ready'));
    })();
    """#
}
