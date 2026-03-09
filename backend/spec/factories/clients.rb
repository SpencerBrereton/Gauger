FactoryBot.define do
  factory :client do
    name { "MyString" }
    address { "MyString" }
    default_project_manager { "MyString" }
    user { nil }
  end
end
