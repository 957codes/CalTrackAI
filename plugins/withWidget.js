/**
 * Expo config plugin to add the CalTrackAI home screen widget extension.
 *
 * What it does:
 * 1. Copies widget source files from targets/widget/ to ios/
 * 2. Adds App Group entitlement to the main app target
 * 3. Adds the CalTrackAIWidgetExtension target to the Xcode project
 * 4. Configures build settings, source/resource phases, and embed phase
 */
const {
  withXcodeProject,
  withEntitlementsPlist,
  withDangerousMod,
} = require("@expo/config-plugins");
const path = require("path");
const fs = require("fs");

const APP_GROUP = "group.com.caltrackai.app";
const WIDGET_NAME = "CalTrackAIWidgetExtension";
const WIDGET_DIR = "CalTrackAIWidget";
const WIDGET_BUNDLE_ID = "com.caltrackai.app.widget";

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function withWidgetFiles(config) {
  return withDangerousMod(config, [
    "ios",
    (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const iosDir = cfg.modRequest.platformProjectRoot;
      const templatesDir = path.join(projectRoot, "targets", "widget");

      if (!fs.existsSync(templatesDir)) {
        console.warn("[withWidget] targets/widget/ not found, skipping file copy");
        return cfg;
      }

      // Copy widget extension files
      const widgetDest = path.join(iosDir, WIDGET_DIR);
      const widgetFiles = [
        "CalTrackAIWidget.swift",
        "Info.plist",
        "CalTrackAIWidget.entitlements",
      ];
      fs.mkdirSync(widgetDest, { recursive: true });
      for (const f of widgetFiles) {
        const src = path.join(templatesDir, f);
        if (fs.existsSync(src)) fs.copyFileSync(src, path.join(widgetDest, f));
      }
      // Copy Assets.xcassets directory
      const assetsSrc = path.join(templatesDir, "Assets.xcassets");
      if (fs.existsSync(assetsSrc)) {
        copyDirSync(assetsSrc, path.join(widgetDest, "Assets.xcassets"));
      }

      // Copy native bridge module files to main app target
      const mainAppDir = path.join(iosDir, "CalTrackAI");
      for (const f of ["WidgetDataBridge.swift", "WidgetDataBridge.m"]) {
        const src = path.join(templatesDir, f);
        if (fs.existsSync(src)) fs.copyFileSync(src, path.join(mainAppDir, f));
      }

      return cfg;
    },
  ]);
}

function withWidgetEntitlements(config) {
  return withEntitlementsPlist(config, (cfg) => {
    cfg.modResults["com.apple.security.application-groups"] = [APP_GROUP];
    return cfg;
  });
}

function withWidgetTarget(config) {
  return withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;

    // Check if target already exists
    const nativeTargets = project.pbxNativeTargetSection();
    for (const key in nativeTargets) {
      if (
        typeof nativeTargets[key] === "object" &&
        nativeTargets[key].name === `"${WIDGET_NAME}"`
      ) {
        return cfg;
      }
    }

    // Add the target
    const target = project.addTarget(
      WIDGET_NAME,
      "app_extension",
      WIDGET_DIR,
      WIDGET_BUNDLE_ID
    );

    if (!target) {
      console.warn("[withWidget] Failed to add widget target");
      return cfg;
    }

    // Create PBX group for widget files
    const widgetGroup = project.addPbxGroup(
      [
        "CalTrackAIWidget.swift",
        "Info.plist",
        "CalTrackAIWidget.entitlements",
        "Assets.xcassets",
      ],
      WIDGET_DIR,
      WIDGET_DIR
    );
    const firstProject = project.getFirstProject();
    if (firstProject && firstProject.firstProject) {
      project.addToPbxGroup(widgetGroup.uuid, firstProject.firstProject.mainGroup);
    }

    // Add build phases
    project.addBuildPhase(
      [`${WIDGET_DIR}/CalTrackAIWidget.swift`],
      "PBXSourcesBuildPhase",
      "Sources",
      target.uuid
    );
    project.addBuildPhase(
      [`${WIDGET_DIR}/Assets.xcassets`],
      "PBXResourcesBuildPhase",
      "Resources",
      target.uuid
    );
    project.addBuildPhase(
      ["WidgetKit.framework", "SwiftUI.framework"],
      "PBXFrameworksBuildPhase",
      "Frameworks",
      target.uuid
    );

    // Configure build settings
    const configs = project.pbxXCBuildConfigurationSection();
    for (const key in configs) {
      const cfg2 = configs[key];
      if (typeof cfg2 !== "object" || !cfg2.buildSettings) continue;
      const bs = cfg2.buildSettings;
      if (
        bs.PRODUCT_BUNDLE_IDENTIFIER === `"${WIDGET_BUNDLE_ID}"` ||
        bs.PRODUCT_BUNDLE_IDENTIFIER === WIDGET_BUNDLE_ID ||
        bs.PRODUCT_NAME === `"${WIDGET_NAME}"`
      ) {
        bs.SWIFT_VERSION = "5.0";
        bs.IPHONEOS_DEPLOYMENT_TARGET = "16.0";
        bs.CODE_SIGN_ENTITLEMENTS = `"${WIDGET_DIR}/CalTrackAIWidget.entitlements"`;
        bs.INFOPLIST_FILE = `"${WIDGET_DIR}/Info.plist"`;
        bs.ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = '"AccentColor"';
        bs.GENERATE_INFOPLIST_FILE = "YES";
        bs.MARKETING_VERSION = "1.0.0";
        bs.CURRENT_PROJECT_VERSION = "1";
        bs.TARGETED_DEVICE_FAMILY = '"1,2"';
        bs.LD_RUNPATH_SEARCH_PATHS =
          '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"';
        bs.SKIP_INSTALL = "YES";
        bs.SWIFT_EMIT_LOC_STRINGS = "YES";
      }
    }

    // Embed widget in main app
    const mainTarget = project.getFirstTarget();
    if (mainTarget) {
      project.addBuildPhase(
        [`${WIDGET_NAME}.appex`],
        "PBXCopyFilesBuildPhase",
        "Embed Foundation Extensions",
        mainTarget.uuid,
        "app_extension"
      );
      project.addTargetDependency(mainTarget.uuid, [target.uuid]);
    }

    return cfg;
  });
}

module.exports = function withWidget(config) {
  config = withWidgetFiles(config);
  config = withWidgetEntitlements(config);
  config = withWidgetTarget(config);
  return config;
};
