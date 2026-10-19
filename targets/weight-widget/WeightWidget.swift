// Виджет WeightApp для главного экрана iOS (SwiftUI + WidgetKit): маленький и средний размер.
//
// Откуда данные: приложение (src/features/widget) после каждого изменения веса, цели, профиля
// или языка записывает компактный JSON-снимок в общее хранилище App Group (UserDefaults).
// Виджет только читает этот снимок — базу приложения он не открывает.
// Все тексты в снимке уже переведены и отформатированы приложением (единицы, язык, даты).
//
// Обновление: приложение просит систему перерисовать виджет (WidgetCenter.reloadAllTimelines),
// но когда именно — решает iOS. Сам виджет дополнительно обновляется раз в сутки (в полночь),
// чтобы вовремя показать «давно не было записей».

import SwiftUI
import WidgetKit

// Должны совпадать с src/features/widget/widgetConfig.js и app.json
private let appGroup = "group.com.weightapp.app"
private let snapshotKey = "widgetSnapshot"
private let supportedVersion = 1

// MARK: - Снимок данных (формат — buildWidgetSnapshot в src/features/widget/widgetSnapshot.js)

struct WidgetGoal: Decodable {
  let type: String
  let target: String
  let progress: Double?
  let status: String
  let statusTone: String?
}

struct WidgetLabels: Decodable {
  let title: String
  let goal: String
  let empty: String
  let stale: String
}

struct WidgetSnapshot: Decodable {
  let version: Int
  let staleAfterDays: Int
  let unit: String
  let hasData: Bool
  let weight: String?
  let measuredAt: String?
  let dateText: String?
  let change: String?
  let changeTone: String
  let goal: WidgetGoal?
  let message: String
  let labels: WidgetLabels

  // Давно не было записей?
  func isStale(at now: Date) -> Bool {
    guard let measuredAt, let date = parseDate(measuredAt) else { return false }
    return now.timeIntervalSince(date) > Double(staleAfterDays) * 24 * 60 * 60
  }
}

private func parseDate(_ value: String) -> Date? {
  let formatter = ISO8601DateFormatter()
  formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
  return formatter.date(from: value) ?? ISO8601DateFormatter().date(from: value)
}

// Снимок из общего хранилища; nil — снимка нет (приложение ещё не открывали) или формат незнаком
func loadSnapshot() -> WidgetSnapshot? {
  guard
    let defaults = UserDefaults(suiteName: appGroup),
    let json = defaults.string(forKey: snapshotKey),
    let data = json.data(using: .utf8),
    let snapshot = try? JSONDecoder().decode(WidgetSnapshot.self, from: data),
    snapshot.version == supportedVersion
  else { return nil }
  return snapshot
}

// MARK: - Таймлайн

struct WeightEntry: TimelineEntry {
  let date: Date
  let snapshot: WidgetSnapshot?
}

struct WeightProvider: TimelineProvider {
  // Заглушка для галереи виджетов — не реальные данные пользователя
  func placeholder(in context: Context) -> WeightEntry {
    WeightEntry(date: Date(), snapshot: nil)
  }

  func getSnapshot(in context: Context, completion: @escaping (WeightEntry) -> Void) {
    completion(WeightEntry(date: Date(), snapshot: loadSnapshot()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<WeightEntry>) -> Void) {
    let now = Date()
    let entry = WeightEntry(date: now, snapshot: loadSnapshot())
    // следующая самостоятельная перерисовка — в начале следующих суток
    let nextMidnight = Calendar.current.nextDate(after: now, matching: DateComponents(hour: 0, minute: 5), matchingPolicy: .nextTime) ?? now.addingTimeInterval(6 * 60 * 60)
    completion(Timeline(entries: [entry], policy: .after(nextMidnight)))
  }
}

// MARK: - Вид

private func toneColor(_ tone: String?) -> Color {
  switch tone {
  case "success": return Color("Success")
  case "error": return Color("Error")
  case "caution": return Color("Caution")
  default: return Color("TextSecondary")
  }
}

// Полоса прогресса цели: градиент от зелёного к голубому, как на Главной приложения
struct GoalProgressBar: View {
  let progress: Double
  var body: some View {
    GeometryReader { geometry in
      ZStack(alignment: .leading) {
        Capsule().fill(Color("Track"))
        Capsule()
          .fill(LinearGradient(colors: [Color("GradientStart"), Color("GradientEnd")], startPoint: .leading, endPoint: .trailing))
          .frame(width: max(8, geometry.size.width * min(max(progress, 0), 1)))
      }
    }
    .frame(height: 8)
  }
}

// Вес, дата и изменение — левая часть (и весь маленький виджет)
struct WeightSummaryView: View {
  let snapshot: WidgetSnapshot
  let now: Date

  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      Text(snapshot.labels.title)
        .font(.system(.caption, design: .rounded).weight(.semibold))
        .foregroundStyle(Color("TextSecondary"))
      HStack(alignment: .firstTextBaseline, spacing: 3) {
        Text(snapshot.weight ?? "-")
          .font(.system(size: 34, weight: .heavy, design: .rounded))
          .minimumScaleFactor(0.6)
          .lineLimit(1)
        Text(snapshot.unit)
          .font(.system(.subheadline, design: .rounded).weight(.semibold))
          .foregroundStyle(Color("TextSecondary"))
      }
      .foregroundStyle(Color("TextPrimary"))
      if let dateText = snapshot.dateText {
        Text(dateText)
          .font(.system(.caption2, design: .rounded))
          .foregroundStyle(Color("TextSecondary"))
      }
      Spacer(minLength: 2)
      if snapshot.isStale(at: now) {
        Text(snapshot.labels.stale)
          .font(.system(.caption2, design: .rounded).weight(.semibold))
          .foregroundStyle(Color("TextSecondary"))
          .lineLimit(2)
      } else if let change = snapshot.change {
        Text(change)
          .font(.system(.footnote, design: .rounded).weight(.bold))
          .foregroundStyle(toneColor(snapshot.changeTone))
      }
    }
  }
}

// Цель и прогресс — правая часть среднего виджета
struct GoalView: View {
  let snapshot: WidgetSnapshot

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      if let goal = snapshot.goal {
        Text("\(snapshot.labels.goal): \(goal.target)")
          .font(.system(.subheadline, design: .rounded).weight(.bold))
          .foregroundStyle(Color("TextPrimary"))
          .lineLimit(1)
          .minimumScaleFactor(0.8)
        if let progress = goal.progress {
          GoalProgressBar(progress: progress)
          Text("\(Int((progress * 100).rounded()))%")
            .font(.system(.caption, design: .rounded).weight(.semibold))
            .foregroundStyle(Color("TextSecondary"))
        }
        Text(goal.status)
          .font(.system(.caption, design: .rounded).weight(.semibold))
          .foregroundStyle(toneColor(goal.statusTone))
          .lineLimit(2)
      } else {
        Text(snapshot.message)
          .font(.system(.footnote, design: .rounded))
          .foregroundStyle(Color("TextSecondary"))
          .lineLimit(4)
      }
    }
  }
}

// Нет снимка или нет записей — понятная подпись вместо чисел
struct EmptyStateView: View {
  let text: String
  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      Image(systemName: "scalemass")
        .font(.title2)
        .foregroundStyle(Color.accentColor)
      Text("WeightApp")
        .font(.system(.headline, design: .rounded).weight(.bold))
        .foregroundStyle(Color("TextPrimary"))
      Text(text)
        .font(.system(.caption, design: .rounded))
        .foregroundStyle(Color("TextSecondary"))
        .lineLimit(3)
      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }
}

struct WeightWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: WeightEntry

  var body: some View {
    Group {
      if let snapshot = entry.snapshot, snapshot.hasData {
        if family == .systemMedium {
          HStack(alignment: .top, spacing: 16) {
            WeightSummaryView(snapshot: snapshot, now: entry.date)
              .frame(maxWidth: .infinity, alignment: .leading)
            GoalView(snapshot: snapshot)
              .frame(maxWidth: .infinity, alignment: .leading)
          }
        } else {
          VStack(alignment: .leading, spacing: 6) {
            WeightSummaryView(snapshot: snapshot, now: entry.date)
            if let progress = snapshot.goal?.progress {
              GoalProgressBar(progress: progress)
            }
          }
          .frame(maxWidth: .infinity, alignment: .leading)
        }
      } else if let snapshot = entry.snapshot {
        EmptyStateView(text: snapshot.labels.empty)
      } else {
        // приложение ещё не открывали после установки виджета (или данные удалены)
        EmptyStateView(text: "Open the app to see your weight")
      }
    }
    .containerBackground(for: .widget) { Color("WidgetBackground") }
    // нажатие открывает приложение на Главной
    .widgetURL(URL(string: "weightapp://"))
  }
}

// MARK: - Виджет

struct WeightWidget: Widget {
  let kind = "WeightWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: WeightProvider()) { entry in
      WeightWidgetView(entry: entry)
    }
    .configurationDisplayName("WeightApp")
    .description("Current weight, last change and goal progress.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

@main
struct WeightWidgetBundle: WidgetBundle {
  var body: some Widget {
    WeightWidget()
  }
}
