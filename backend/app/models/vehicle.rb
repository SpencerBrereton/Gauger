class Vehicle < ApplicationRecord
  belongs_to :user
  has_one_attached :photo
  has_many :mileage_logs, dependent: :destroy

  enum :ruleset, { personal: 0, work: 1, hybrid: 2 }, default: :personal

  validates :name, presence: true
  validates :ruleset, presence: true
end
