class User < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher

  devise :database_authenticatable, :registerable,
         :recoverable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: self

  enum :role, { contractor: 0, admin: 1 }, default: :contractor

  has_many :expenses, dependent: :destroy
  has_many :invoices, dependent: :destroy
  has_many :reconciliation_reports, dependent: :destroy
  has_many :categories, dependent: :destroy
  has_many :vehicles, dependent: :destroy
  has_many :mileage_logs, dependent: :destroy
  has_one  :user_profile, dependent: :destroy
  has_many :clients, dependent: :destroy

  validates :email, presence: true, uniqueness: { case_sensitive: false }
  validates :role, presence: true

  after_create :create_default_categories

  private

  def create_default_categories
    ["Travel", "Meals", "Equipment", "Software", "Office", "Other"].each do |name|
      categories.create!(name: name)
    end
  end
end
