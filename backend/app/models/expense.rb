class Expense < ApplicationRecord
  belongs_to :user
  belongs_to :category, optional: true
  has_one_attached :receipt_image

  enum :status, { pending: 0, approved: 1, rejected: 2 }, default: :pending

  validates :title, presence: true
  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :date, presence: true
  validates :status, presence: true

  # Optional but recommended validations for the new extracted fields
  validates :subtotal, numericality: { greater_than_or_equal_to: 0, allow_nil: true }
  validates :tax, numericality: { greater_than_or_equal_to: 0, allow_nil: true }
  validates :tip, numericality: { greater_than_or_equal_to: 0, allow_nil: true }
  validates :final_total, numericality: { greater_than_or_equal_to: 0, allow_nil: true }
end
