class MileageLog < ApplicationRecord
  belongs_to :user
  belongs_to :vehicle

  has_one_attached :receipt
  
  validates :date, presence: true
end
