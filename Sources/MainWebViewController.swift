import UIKit
import WebKit

final class MainWebViewController: UIViewController, WKNavigationDelegate, WKUIDelegate {
    private(set) var webView: WKWebView!
    private var bridge: MidadBridge!
    private var statusBarBgView: UIView!
    private var currentLightStatusIcons = false

    override var preferredStatusBarStyle: UIStatusBarStyle {
        return currentLightStatusIcons ? .darkContent : .lightContent
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 247/255, green: 241/255, blue: 227/255, alpha: 1)

        bridge = MidadBridge(owner: self)

        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        config.setValue(true, forKey: "allowUniversalAccessFromFileURLs")

        let ucc = config.userContentController
        ucc.add(bridge, name: "midad")

        let shimScript = WKUserScript(
            source: bridge.bootstrapJavaScript(),
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        )
        ucc.addUserScript(shimScript)

        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.isOpaque = false
        webView.backgroundColor = view.backgroundColor
        webView.scrollView.backgroundColor = view.backgroundColor
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.allowsBackForwardNavigationGestures = false
        webView.translatesAutoresizingMaskIntoConstraints = false

        statusBarBgView = UIView()
        statusBarBgView.translatesAutoresizingMaskIntoConstraints = false
        statusBarBgView.backgroundColor = view.backgroundColor

        view.addSubview(webView)
        view.addSubview(statusBarBgView)

        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            statusBarBgView.topAnchor.constraint(equalTo: view.topAnchor),
            statusBarBgView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            statusBarBgView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            statusBarBgView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor)
        ])

        loadBundledWebApp()
    }

    private func loadBundledWebApp() {
        if let indexUrl = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "www") {
            let wwwDir = indexUrl.deletingLastPathComponent()
            webView.loadFileURL(indexUrl, allowingReadAccessTo: wwwDir)
        } else if let rootIndex = Bundle.main.url(forResource: "index", withExtension: "html") {
            webView.loadFileURL(rootIndex, allowingReadAccessTo: rootIndex.deletingLastPathComponent())
        }
    }

    func applySystemAppearance(hex: String, lightIcons: Bool) {
        DispatchQueue.main.async {
            if let col = UIColor.midadHex(hex) {
                self.view.backgroundColor = col
                self.webView.backgroundColor = col
                self.webView.scrollView.backgroundColor = col
                self.statusBarBgView.backgroundColor = col.withAlphaComponent(0.92)
            }
            self.currentLightStatusIcons = lightIcons
            self.setNeedsStatusBarAppearanceUpdate()
        }
    }

    func evalJS(_ js: String) {
        DispatchQueue.main.async {
            self.webView?.evaluateJavaScript(js, completionHandler: nil)
        }
    }

    // Handle target=_blank links safely in Safari
    func webView(
        _ webView: WKWebView,
        createWebViewWith configuration: WKWebViewConfiguration,
        for navigationAction: WKNavigationAction,
        windowFeatures: WKWindowFeatures
    ) -> WKWebView? {
        if let url = navigationAction.request.url {
            UIApplication.shared.open(url, options: [:], completionHandler: nil)
        }
        return nil
    }
}
