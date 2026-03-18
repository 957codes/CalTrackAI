#!/usr/bin/env node
/**
 * Adds the CalTrackAIWidgetExtension target to the Xcode project.
 * Run once after creating the widget extension files.
 *
 * Usage: node scripts/add-widget-target.js
 */
const xcode = require("xcode");
const path = require("path");
const fs = require("fs");

const PROJECT_PATH = path.join(
  __dirname,
  "..",
  "ios",
  "CalTrackAI.xcodeproj",
  "project.pbxproj"
);

const WIDGET_NAME = "CalTrackAIWidgetExtension";
const WIDGET_DIR = "CalTrackAIWidget";
const WIDGET_BUNDLE_ID = "com.caltrackai.app.widget";

function main() {
  console.log("Reading Xcode project...");
  const project = xcode.project(PROJECT_PATH);
  project.parseSync();

  // Check if target already exists
  const nativeTargets = project.pbxNativeTargetSection();
  for (const key in nativeTargets) {
    if (
      typeof nativeTargets[key] === "object" &&
      nativeTargets[key].name === `"${WIDGET_NAME}"`
    ) {
      console.log("Widget target already exists. Skipping.");
      return;
    }
  }

  console.log("Adding widget extension target...");

  // Add the target (creates PBXNativeTarget, build config list, etc.)
  const target = project.addTarget(
    WIDGET_NAME,
    "app_extension",
    WIDGET_DIR,
    WIDGET_BUNDLE_ID
  );

  if (!target) {
    console.error("Failed to add target");
    process.exit(1);
  }

  console.log("Target UUID:", target.uuid);

  // Create a PBX group for the widget
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

  // Add group to main project group
  const firstProject = project.getFirstProject();
  if (firstProject && firstProject.firstProject) {
    project.addToPbxGroup(widgetGroup.uuid, firstProject.firstProject.mainGroup);
  }

  // Add source build phase to widget target
  const sourceBuildPhase = project.addBuildPhase(
    [`${WIDGET_DIR}/CalTrackAIWidget.swift`],
    "PBXSourcesBuildPhase",
    "Sources",
    target.uuid
  );

  // Add resources build phase to widget target
  const resourceBuildPhase = project.addBuildPhase(
    [`${WIDGET_DIR}/Assets.xcassets`],
    "PBXResourcesBuildPhase",
    "Resources",
    target.uuid
  );

  // Add frameworks build phase (WidgetKit + SwiftUI)
  const frameworkBuildPhase = project.addBuildPhase(
    ["WidgetKit.framework", "SwiftUI.framework"],
    "PBXFrameworksBuildPhase",
    "Frameworks",
    target.uuid
  );

  // Update build settings for widget configurations
  const configs = project.pbxXCBuildConfigurationSection();
  for (const key in configs) {
    const cfg = configs[key];
    if (typeof cfg !== "object" || !cfg.buildSettings) continue;

    const bs = cfg.buildSettings;
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
      bs.SWIFT_OPTIMIZATION_LEVEL = bs.SWIFT_OPTIMIZATION_LEVEL || '"-Onone"';
    }
  }

  // Add embed extension phase to main target
  const mainTarget = project.getFirstTarget();
  if (mainTarget) {
    project.addBuildPhase(
      [`${WIDGET_NAME}.appex`],
      "PBXCopyFilesBuildPhase",
      "Embed Foundation Extensions",
      mainTarget.uuid,
      "app_extension"
    );
    console.log("Added embed phase to main target");
  }

  // Add target dependency (main app depends on widget)
  project.addTargetDependency(mainTarget.uuid, [target.uuid]);

  // Write back
  const output = project.writeSync();
  fs.writeFileSync(PROJECT_PATH, output);
  console.log("Widget target added successfully!");
}

main();
