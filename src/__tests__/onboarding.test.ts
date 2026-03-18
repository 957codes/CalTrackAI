import { calculateTDEE, calculateGoals } from "../utils/onboarding";

describe("calculateTDEE", () => {
  it("calculates BMR correctly for a male", () => {
    // Mifflin-St Jeor: 10*80 + 6.25*180 - 5*30 + 5 = 800+1125-150+5 = 1780
    // Sedentary multiplier: 1.2 → 1780 * 1.2 = 2136
    const tdee = calculateTDEE("male", 80, 180, 30, "sedentary");
    expect(tdee).toBe(2136);
  });

  it("calculates BMR correctly for a female", () => {
    // Mifflin-St Jeor: 10*60 + 6.25*165 - 5*25 - 161 = 600+1031.25-125-161 = 1345.25
    // Light multiplier: 1.375 → 1345.25 * 1.375 = 1849.72 → 1850
    const tdee = calculateTDEE("female", 60, 165, 25, "light");
    expect(tdee).toBe(1850);
  });

  it("applies activity multipliers correctly", () => {
    const sedentary = calculateTDEE("male", 70, 175, 25, "sedentary");
    const active = calculateTDEE("male", 70, 175, 25, "active");
    expect(active).toBeGreaterThan(sedentary);
  });

  it("returns higher TDEE for heavier person", () => {
    const light = calculateTDEE("male", 60, 175, 30, "moderate");
    const heavy = calculateTDEE("male", 100, 175, 30, "moderate");
    expect(heavy).toBeGreaterThan(light);
  });
});

describe("calculateGoals", () => {
  it("calculates goals with profile data", () => {
    const goals = calculateGoals("maintain", "moderate", {
      gender: "male",
      weightKg: 80,
      heightCm: 180,
      age: 30,
    });
    expect(goals.weightGoal).toBe("maintain");
    expect(goals.activityLevel).toBe("moderate");
    // TDEE = 2136 * (1.55/1.2) ≈ no, calculateTDEE(male,80,180,30,moderate)
    // BMR = 1780, TDEE = 1780 * 1.55 = 2759
    expect(goals.targetCalories).toBe(2759);
    expect(goals.targetProtein).toBeGreaterThan(0);
    expect(goals.targetCarbs).toBeGreaterThan(0);
    expect(goals.targetFat).toBeGreaterThan(0);
  });

  it("applies -500 adjustment for weight loss", () => {
    const maintain = calculateGoals("maintain", "moderate", {
      gender: "male",
      weightKg: 80,
      heightCm: 180,
      age: 30,
    });
    const lose = calculateGoals("lose", "moderate", {
      gender: "male",
      weightKg: 80,
      heightCm: 180,
      age: 30,
    });
    expect(lose.targetCalories).toBe(maintain.targetCalories - 500);
  });

  it("applies +400 adjustment for weight gain", () => {
    const maintain = calculateGoals("maintain", "moderate", {
      gender: "male",
      weightKg: 80,
      heightCm: 180,
      age: 30,
    });
    const gain = calculateGoals("gain", "moderate", {
      gender: "male",
      weightKg: 80,
      heightCm: 180,
      age: 30,
    });
    expect(gain.targetCalories).toBe(maintain.targetCalories + 400);
  });

  it("enforces minimum 1200 calories", () => {
    // Very small person losing weight
    const goals = calculateGoals("lose", "sedentary", {
      gender: "female",
      weightKg: 40,
      heightCm: 145,
      age: 60,
    });
    expect(goals.targetCalories).toBeGreaterThanOrEqual(1200);
  });

  it("uses macro split 30/40/30 (P/C/F)", () => {
    const goals = calculateGoals("maintain", "moderate", {
      gender: "male",
      weightKg: 80,
      heightCm: 180,
      age: 30,
    });
    // Protein: 30% of calories / 4 cal per gram
    expect(goals.targetProtein).toBe(
      Math.round((goals.targetCalories * 0.3) / 4)
    );
    // Carbs: 40% of calories / 4 cal per gram
    expect(goals.targetCarbs).toBe(
      Math.round((goals.targetCalories * 0.4) / 4)
    );
    // Fat: 30% of calories / 9 cal per gram
    expect(goals.targetFat).toBe(
      Math.round((goals.targetCalories * 0.3) / 9)
    );
  });

  it("falls back to defaults when no profile provided", () => {
    const goals = calculateGoals("maintain", "moderate");
    expect(goals.targetCalories).toBeGreaterThan(0);
    expect(goals.targetProtein).toBeGreaterThan(0);
  });
});
