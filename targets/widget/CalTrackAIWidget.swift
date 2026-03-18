import WidgetKit
import SwiftUI

// MARK: - Data Model

struct WidgetData {
  let caloriesConsumed: Int
  let caloriesGoal: Int
  let proteinConsumed: Int
  let proteinGoal: Int
  let carbsConsumed: Int
  let carbsGoal: Int
  let fatConsumed: Int
  let fatGoal: Int
  let waterConsumedOz: Int
  let waterGoalOz: Int
  let mealsLogged: Int
  let streakDays: Int
  let lastMealName: String
  let lastMealTime: Date?
  let lastUpdated: Date?

  var caloriesRemaining: Int { max(0, caloriesGoal - caloriesConsumed) }
  var caloriesProgress: Double {
    guard caloriesGoal > 0 else { return 0 }
    return min(1.0, Double(caloriesConsumed) / Double(caloriesGoal))
  }
  var proteinProgress: Double {
    guard proteinGoal > 0 else { return 0 }
    return min(1.0, Double(proteinConsumed) / Double(proteinGoal))
  }
  var carbsProgress: Double {
    guard carbsGoal > 0 else { return 0 }
    return min(1.0, Double(carbsConsumed) / Double(carbsGoal))
  }
  var fatProgress: Double {
    guard fatGoal > 0 else { return 0 }
    return min(1.0, Double(fatConsumed) / Double(fatGoal))
  }
  var waterProgress: Double {
    guard waterGoalOz > 0 else { return 0 }
    return min(1.0, Double(waterConsumedOz) / Double(waterGoalOz))
  }

  /// Color for the calorie ring: green=on track, yellow=close to goal, red=over
  var calorieRingColor: Color {
    if caloriesConsumed > caloriesGoal { return WidgetColors.red }
    if caloriesProgress >= 0.85 { return WidgetColors.yellow }
    return WidgetColors.green
  }

  static let placeholder = WidgetData(
    caloriesConsumed: 1250, caloriesGoal: 2000,
    proteinConsumed: 85, proteinGoal: 150,
    carbsConsumed: 120, carbsGoal: 200,
    fatConsumed: 40, fatGoal: 67,
    waterConsumedOz: 40, waterGoalOz: 64,
    mealsLogged: 3, streakDays: 5,
    lastMealName: "Grilled Chicken Salad",
    lastMealTime: Date(), lastUpdated: Date()
  )

  static func load() -> WidgetData {
    guard let defaults = UserDefaults(suiteName: "group.com.caltrackai.app"),
          let dict = defaults.dictionary(forKey: "widgetData") else {
      return placeholder
    }
    let lastMealTimeMs = dict["lastMealTime"] as? Double ?? 0
    let lastUpdatedMs = dict["lastUpdated"] as? Double ?? 0
    return WidgetData(
      caloriesConsumed: dict["caloriesConsumed"] as? Int ?? 0,
      caloriesGoal: dict["caloriesGoal"] as? Int ?? 2000,
      proteinConsumed: dict["proteinConsumed"] as? Int ?? 0,
      proteinGoal: dict["proteinGoal"] as? Int ?? 150,
      carbsConsumed: dict["carbsConsumed"] as? Int ?? 0,
      carbsGoal: dict["carbsGoal"] as? Int ?? 200,
      fatConsumed: dict["fatConsumed"] as? Int ?? 0,
      fatGoal: dict["fatGoal"] as? Int ?? 67,
      waterConsumedOz: dict["waterConsumedOz"] as? Int ?? 0,
      waterGoalOz: dict["waterGoalOz"] as? Int ?? 64,
      mealsLogged: dict["mealsLogged"] as? Int ?? 0,
      streakDays: dict["streakDays"] as? Int ?? 0,
      lastMealName: dict["lastMealName"] as? String ?? "",
      lastMealTime: lastMealTimeMs > 0 ? Date(timeIntervalSince1970: lastMealTimeMs / 1000) : nil,
      lastUpdated: lastUpdatedMs > 0 ? Date(timeIntervalSince1970: lastUpdatedMs / 1000) : nil
    )
  }
}

// MARK: - Timeline Provider

struct CalTrackProvider: TimelineProvider {
  func placeholder(in context: Context) -> CalTrackEntry {
    CalTrackEntry(date: Date(), data: .placeholder)
  }

  func getSnapshot(in context: Context, completion: @escaping (CalTrackEntry) -> Void) {
    completion(CalTrackEntry(date: Date(), data: WidgetData.load()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<CalTrackEntry>) -> Void) {
    let entry = CalTrackEntry(date: Date(), data: WidgetData.load())
    // Refresh every 15 minutes
    let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
    let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
    completion(timeline)
  }
}

struct CalTrackEntry: TimelineEntry {
  let date: Date
  let data: WidgetData
}

// MARK: - Theme Colors

struct WidgetColors {
  static let background = Color(red: 0.059, green: 0.059, blue: 0.137) // #0f0f23
  static let surface = Color(red: 0.102, green: 0.102, blue: 0.180) // #1a1a2e
  static let green = Color(red: 0.290, green: 0.855, blue: 0.502) // #4ade80
  static let blue = Color(red: 0.231, green: 0.510, blue: 0.965) // #3b82f6
  static let yellow = Color(red: 0.918, green: 0.702, blue: 0.031) // #eab308
  static let orange = Color(red: 0.976, green: 0.451, blue: 0.086) // #f97316
  static let red = Color(red: 0.937, green: 0.267, blue: 0.267) // #ef4444
  static let cyan = Color(red: 0.024, green: 0.714, blue: 0.831) // #06b6d4
  static let trackDark = Color.white.opacity(0.1)
  static let trackLight = Color.black.opacity(0.1)
}

// MARK: - Small Widget View

struct SmallWidgetView: View {
  let data: WidgetData
  @Environment(\.colorScheme) var colorScheme

  private var trackColor: Color {
    colorScheme == .dark ? WidgetColors.trackDark : WidgetColors.trackLight
  }
  private var textColor: Color {
    colorScheme == .dark ? .white : .black
  }
  private var secondaryText: Color {
    colorScheme == .dark ? Color.white.opacity(0.6) : Color.black.opacity(0.5)
  }

  var body: some View {
    VStack(spacing: 6) {
      ZStack {
        Circle()
          .stroke(trackColor, lineWidth: 8)
          .frame(width: 80, height: 80)
        Circle()
          .trim(from: 0, to: data.caloriesProgress)
          .stroke(data.calorieRingColor, style: StrokeStyle(lineWidth: 8, lineCap: .round))
          .frame(width: 80, height: 80)
          .rotationEffect(.degrees(-90))
        VStack(spacing: 1) {
          Text("\(data.caloriesConsumed)")
            .font(.system(size: 20, weight: .bold, design: .rounded))
            .foregroundColor(textColor)
          Text("/ \(data.caloriesGoal)")
            .font(.system(size: 10, weight: .medium, design: .rounded))
            .foregroundColor(secondaryText)
        }
      }

      Text("\(data.caloriesRemaining) cal left")
        .font(.system(size: 12, weight: .medium, design: .rounded))
        .foregroundColor(data.calorieRingColor)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .widgetBackground(colorScheme: colorScheme)
  }
}

// MARK: - Medium Widget View

struct MediumWidgetView: View {
  let data: WidgetData
  @Environment(\.colorScheme) var colorScheme

  private var trackColor: Color {
    colorScheme == .dark ? WidgetColors.trackDark : WidgetColors.trackLight
  }
  private var textColor: Color {
    colorScheme == .dark ? .white : .black
  }
  private var secondaryText: Color {
    colorScheme == .dark ? Color.white.opacity(0.6) : Color.black.opacity(0.5)
  }

  var body: some View {
    HStack(spacing: 16) {
      // Left: Calorie ring
      VStack(spacing: 6) {
        ZStack {
          Circle()
            .stroke(trackColor, lineWidth: 7)
            .frame(width: 72, height: 72)
          Circle()
            .trim(from: 0, to: data.caloriesProgress)
            .stroke(data.calorieRingColor, style: StrokeStyle(lineWidth: 7, lineCap: .round))
            .frame(width: 72, height: 72)
            .rotationEffect(.degrees(-90))
          VStack(spacing: 1) {
            Text("\(data.caloriesConsumed)")
              .font(.system(size: 18, weight: .bold, design: .rounded))
              .foregroundColor(textColor)
            Text("/ \(data.caloriesGoal)")
              .font(.system(size: 9, weight: .medium, design: .rounded))
              .foregroundColor(secondaryText)
          }
        }
        Text("\(data.caloriesRemaining) left")
          .font(.system(size: 11, weight: .medium, design: .rounded))
          .foregroundColor(data.calorieRingColor)
      }

      // Right: Macros + water
      VStack(alignment: .leading, spacing: 5) {
        MacroBarView(
          label: "P", value: data.proteinConsumed, goal: data.proteinGoal,
          progress: data.proteinProgress, color: WidgetColors.blue,
          trackColor: trackColor, textColor: textColor
        )
        MacroBarView(
          label: "C", value: data.carbsConsumed, goal: data.carbsGoal,
          progress: data.carbsProgress, color: WidgetColors.yellow,
          trackColor: trackColor, textColor: textColor
        )
        MacroBarView(
          label: "F", value: data.fatConsumed, goal: data.fatGoal,
          progress: data.fatProgress, color: WidgetColors.orange,
          trackColor: trackColor, textColor: textColor
        )
        // Water bar
        HStack(spacing: 6) {
          Text("💧")
            .font(.system(size: 9))
            .frame(width: 14, alignment: .leading)
          GeometryReader { geo in
            ZStack(alignment: .leading) {
              RoundedRectangle(cornerRadius: 3)
                .fill(trackColor)
                .frame(height: 6)
              RoundedRectangle(cornerRadius: 3)
                .fill(WidgetColors.cyan)
                .frame(width: geo.size.width * data.waterProgress, height: 6)
            }
          }
          .frame(height: 6)
          Text("\(data.waterConsumedOz)oz")
            .font(.system(size: 10, weight: .medium, design: .rounded))
            .foregroundColor(textColor.opacity(0.8))
            .frame(width: 32, alignment: .trailing)
        }
      }
      .frame(maxWidth: .infinity, alignment: .leading)
    }
    .padding(.horizontal, 4)
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .widgetBackground(colorScheme: colorScheme)
  }
}

// MARK: - Large Widget View

struct LargeWidgetView: View {
  let data: WidgetData
  @Environment(\.colorScheme) var colorScheme

  private var trackColor: Color {
    colorScheme == .dark ? WidgetColors.trackDark : WidgetColors.trackLight
  }
  private var textColor: Color {
    colorScheme == .dark ? .white : .black
  }
  private var secondaryText: Color {
    colorScheme == .dark ? Color.white.opacity(0.6) : Color.black.opacity(0.5)
  }
  private var cardColor: Color {
    colorScheme == .dark ? WidgetColors.surface : Color(.secondarySystemBackground)
  }

  var body: some View {
    VStack(spacing: 12) {
      // Header: Calorie ring + summary
      HStack(spacing: 16) {
        ZStack {
          Circle()
            .stroke(trackColor, lineWidth: 8)
            .frame(width: 90, height: 90)
          Circle()
            .trim(from: 0, to: data.caloriesProgress)
            .stroke(data.calorieRingColor, style: StrokeStyle(lineWidth: 8, lineCap: .round))
            .frame(width: 90, height: 90)
            .rotationEffect(.degrees(-90))
          VStack(spacing: 1) {
            Text("\(data.caloriesConsumed)")
              .font(.system(size: 22, weight: .bold, design: .rounded))
              .foregroundColor(textColor)
            Text("/ \(data.caloriesGoal)")
              .font(.system(size: 10, weight: .medium, design: .rounded))
              .foregroundColor(secondaryText)
          }
        }

        VStack(alignment: .leading, spacing: 8) {
          Text("\(data.caloriesRemaining) cal remaining")
            .font(.system(size: 14, weight: .semibold, design: .rounded))
            .foregroundColor(data.calorieRingColor)

          if data.streakDays > 0 {
            HStack(spacing: 4) {
              Text("🔥")
                .font(.system(size: 12))
              Text("\(data.streakDays) day streak")
                .font(.system(size: 12, weight: .medium, design: .rounded))
                .foregroundColor(WidgetColors.orange)
            }
          }

          HStack(spacing: 4) {
            Image(systemName: "fork.knife")
              .font(.system(size: 10))
              .foregroundColor(secondaryText)
            Text("\(data.mealsLogged) meal\(data.mealsLogged == 1 ? "" : "s") logged")
              .font(.system(size: 12, weight: .medium, design: .rounded))
              .foregroundColor(secondaryText)
          }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
      }

      // Macros section
      VStack(spacing: 6) {
        MacroBarView(
          label: "P", value: data.proteinConsumed, goal: data.proteinGoal,
          progress: data.proteinProgress, color: WidgetColors.blue,
          trackColor: trackColor, textColor: textColor
        )
        MacroBarView(
          label: "C", value: data.carbsConsumed, goal: data.carbsGoal,
          progress: data.carbsProgress, color: WidgetColors.yellow,
          trackColor: trackColor, textColor: textColor
        )
        MacroBarView(
          label: "F", value: data.fatConsumed, goal: data.fatGoal,
          progress: data.fatProgress, color: WidgetColors.orange,
          trackColor: trackColor, textColor: textColor
        )
      }
      .padding(.horizontal, 4)
      .padding(.vertical, 8)
      .background(cardColor)
      .cornerRadius(10)

      // Water section
      HStack(spacing: 12) {
        VStack(spacing: 4) {
          Text("💧")
            .font(.system(size: 20))
          Text("\(data.waterConsumedOz)")
            .font(.system(size: 18, weight: .bold, design: .rounded))
            .foregroundColor(WidgetColors.cyan)
          Text("/ \(data.waterGoalOz) oz")
            .font(.system(size: 10, weight: .medium, design: .rounded))
            .foregroundColor(secondaryText)
        }
        .frame(width: 70)

        VStack(alignment: .leading, spacing: 4) {
          GeometryReader { geo in
            ZStack(alignment: .leading) {
              RoundedRectangle(cornerRadius: 4)
                .fill(trackColor)
                .frame(height: 8)
              RoundedRectangle(cornerRadius: 4)
                .fill(WidgetColors.cyan)
                .frame(width: geo.size.width * data.waterProgress, height: 8)
            }
          }
          .frame(height: 8)

          let glasses = data.waterConsumedOz / 8
          let goalGlasses = max(1, data.waterGoalOz / 8)
          Text("\(glasses) of \(goalGlasses) glasses")
            .font(.system(size: 11, weight: .medium, design: .rounded))
            .foregroundColor(secondaryText)
        }
      }
      .padding(.horizontal, 4)
      .padding(.vertical, 8)
      .background(cardColor)
      .cornerRadius(10)

      // Last meal
      if !data.lastMealName.isEmpty {
        HStack(spacing: 6) {
          Image(systemName: "fork.knife")
            .font(.system(size: 10))
            .foregroundColor(secondaryText)
          Text("Last: \(data.lastMealName)")
            .font(.system(size: 11, weight: .medium, design: .rounded))
            .foregroundColor(secondaryText)
            .lineLimit(1)
          Spacer()
          if let time = data.lastMealTime {
            Text(time, style: .time)
              .font(.system(size: 10, weight: .medium, design: .rounded))
              .foregroundColor(secondaryText)
          }
        }
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .widgetBackground(colorScheme: colorScheme)
  }
}

// MARK: - Macro Bar Component

struct MacroBarView: View {
  let label: String
  let value: Int
  let goal: Int
  let progress: Double
  let color: Color
  let trackColor: Color
  let textColor: Color

  var body: some View {
    HStack(spacing: 6) {
      Text(label)
        .font(.system(size: 11, weight: .bold, design: .rounded))
        .foregroundColor(color)
        .frame(width: 14, alignment: .leading)

      GeometryReader { geo in
        ZStack(alignment: .leading) {
          RoundedRectangle(cornerRadius: 3)
            .fill(trackColor)
            .frame(height: 6)
          RoundedRectangle(cornerRadius: 3)
            .fill(color)
            .frame(width: geo.size.width * progress, height: 6)
        }
      }
      .frame(height: 6)

      Text("\(value)g")
        .font(.system(size: 10, weight: .medium, design: .rounded))
        .foregroundColor(textColor.opacity(0.8))
        .frame(width: 32, alignment: .trailing)
    }
  }
}

// MARK: - Background Modifier

extension View {
  func widgetBackground(colorScheme: ColorScheme) -> some View {
    if #available(iOS 17.0, *) {
      return self.containerBackground(for: .widget) {
        colorScheme == .dark ? Color(WidgetColors.background) : Color(.systemBackground)
      }
    } else {
      return self.padding()
        .background(colorScheme == .dark ? WidgetColors.background : Color(.systemBackground))
    }
  }
}

// MARK: - Widget Definition

struct CalTrackAIWidget: Widget {
  let kind = "CalTrackAIWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: CalTrackProvider()) { entry in
      CalTrackWidgetEntryView(entry: entry)
    }
    .configurationDisplayName("CalTrack AI")
    .description("Track your daily calorie, macro, and water progress at a glance.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
  }
}

struct CalTrackWidgetEntryView: View {
  @Environment(\.widgetFamily) var family
  let entry: CalTrackEntry

  var body: some View {
    switch family {
    case .systemLarge:
      LargeWidgetView(data: entry.data)
        .widgetURL(URL(string: "caltrackai://dashboard"))
    case .systemMedium:
      MediumWidgetView(data: entry.data)
        .widgetURL(URL(string: "caltrackai://dashboard"))
    default:
      SmallWidgetView(data: entry.data)
        .widgetURL(URL(string: "caltrackai://camera"))
    }
  }
}

// MARK: - Widget Bundle

@main
struct CalTrackAIWidgetBundle: WidgetBundle {
  var body: some Widget {
    CalTrackAIWidget()
  }
}

// MARK: - Previews

#if DEBUG
struct CalTrackAIWidget_Previews: PreviewProvider {
  static var previews: some View {
    CalTrackWidgetEntryView(entry: CalTrackEntry(date: Date(), data: .placeholder))
      .previewContext(WidgetPreviewContext(family: .systemSmall))
      .previewDisplayName("Small")

    CalTrackWidgetEntryView(entry: CalTrackEntry(date: Date(), data: .placeholder))
      .previewContext(WidgetPreviewContext(family: .systemMedium))
      .previewDisplayName("Medium")

    CalTrackWidgetEntryView(entry: CalTrackEntry(date: Date(), data: .placeholder))
      .previewContext(WidgetPreviewContext(family: .systemLarge))
      .previewDisplayName("Large")
  }
}
#endif
