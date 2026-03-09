FactoryBot.define do
  factory :invoice_line do
    invoice { nil }
    date { "2026-03-08" }
    day_rate { "9.99" }
    field_expenses { "9.99" }
    office_meeting { "9.99" }
    other_expenses { "9.99" }
    vehicle_mileage { "9.99" }
    rotation_mileage { "9.99" }
    daily_total { "9.99" }
    expense { nil }
    mileage_log { nil }
  end
end
