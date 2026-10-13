import UIKit
import Capacitor
import StoreKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = AppViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}

// Registers the app's own plugins with the Capacitor bridge.
class AppViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(ReviewPlugin())
    }
}

// App Store: Apple's rating prompt (Apple decides whether and how often it appears), and the app's page or its write-review page.
@objc(ReviewPlugin)
public class ReviewPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ReviewPlugin"
    public let jsName = "Review"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "request", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openStore", returnType: CAPPluginReturnPromise)
    ]

    @objc func request(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if let scene = UIApplication.shared.connectedScenes.first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene {
                if #available(iOS 16.0, *) { AppStore.requestReview(in: scene) } else { SKStoreReviewController.requestReview(in: scene) }
            }
            call.resolve()
        }
    }

    @objc func openStore(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let page = call.getBool("review", true) ? "?action=write-review" : ""
            guard let url = URL(string: "itms-apps://apps.apple.com/app/id6821509962" + page) else { return call.reject("Invalid URL") }
            UIApplication.shared.open(url) { opened in opened ? call.resolve() : call.reject("App Store unavailable") }
        }
    }
}
