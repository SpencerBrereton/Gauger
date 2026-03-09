class Invoice < ApplicationRecord
  belongs_to :user
  belongs_to :client, optional: true

  has_many :invoice_lines, dependent: :destroy
  accepts_nested_attributes_for :invoice_lines, allow_destroy: true

  enum :status, { sent: 1, paid: 2, overdue: 3 }, default: :sent

  validates :invoice_number, presence: true, uniqueness: true
  validates :client_name, presence: true
  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :due_date, presence: true
  validates :status, presence: true
end
