FactoryBot.define do
  factory :user_profile do
    company_name { "MyString" }
    company_address { "MyString" }
    phone { "MyString" }
    user_name { "MyString" }
    gst_number { "MyString" }
    wcb_number { "MyString" }
    default_day_rate { "9.99" }
    default_office_rate { "9.99" }
    user { nil }
  end
end
