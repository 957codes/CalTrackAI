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

  static let placeholder = WidgetData(
    caloriesConsumed: 1250, caloriesGoal: 2000,
    proteinConsumed: 85, proteinGoal: 150,
    carbsConsumed: 120, carbsGoal: 200,
    fatConsumed: 40, fatGoal: 67,
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
    // Refresh every 30 minutes
    let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
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
          .stroke(WidgetColors.green, style: StrokeStyle(lineWidth: 8, lineCap: .round))
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
        .foregroundColor(WidgetColors.green)
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
            .stroke(WidgetColors.green, style: StrokeStyle(lineWidth: 7, lineCap: .round))
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
          .foregroundColor(WidgetColors.green)
      }

      // Right: Macros + last meal
      VStack(alignment: .leading, spacing: 6) {
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

        if !data.lastMealName.isEmpty {
          Spacer(minLength: 2)
          HStack(spacing: 4) {
            Image(systemName: "fork.knife")
              .font(.system(size: 9))
              .foregroundColor(secondaryText)
            Text(data.lastMealName)
              .font(.system(size: 10, weight: .medium))
              .foregroundColor(secondaryText)
              .lineLimit(1)
          }
        }
      }
      .frame(maxWidth: .infinity, alignment: .leading)
    }
    .padding(.horizontal, 4)
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
        .widgetURL(URL(string: "caltrackai://camera"))
    }
    .configurationDisplayName("CalTrack AI")
    .description("Track your daily calorie and macro progress at a glance.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

struct CalTrackWidgetEntryView: View {
  @Environment(\.widgetFamily) var family
  let entry: CalTrackEntry

  var body: some View {
    switch family {
    case .systemMedium:
      MediumWidgetView(data: entry.data)
    default:
      SmallWidgetView(data: entry.data)
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
  }
}
#endif
