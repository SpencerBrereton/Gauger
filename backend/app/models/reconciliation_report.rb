class ReconciliationReport < ApplicationRecord
  belongs_to :user

  validates :period_start, presence: true
  validates :period_end, presence: true
  validates :total_expenses, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :total_invoiced, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validate :period_end_after_period_start

  private

  def period_end_after_period_start
    return unless period_start && period_end
    errors.add(:period_end, "must be after period start") if period_end < period_start
  end
end
