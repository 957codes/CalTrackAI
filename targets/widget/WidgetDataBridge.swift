import Foundation
import WidgetKit

@objc(WidgetDataBridge)
class WidgetDataBridge: NSObject {
  private static let appGroup = "group.com.caltrackai.app"
  private static let dataKey = "widgetData"

  @objc static func requiresMainQueueSetup() -> Bool { return false }

  @objc func setWidgetData(_ data: NSDictionary,
                           resolver resolve: @escaping RCTPromiseResolveBlock,
                           rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard let defaults = UserDefaults(suiteName: WidgetDataBridge.appGroup) else {
      reject("APP_GROUP_ERROR", "Failed to access app group UserDefaults", nil)
      return
    }
    defaults.set(data, forKey: WidgetDataBridge.dataKey)
    defaults.synchronize()

    // Reload widget timelines
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
    }

    resolve(nil)
  }
}
