class Category < ApplicationRecord
  belongs_to :user
  has_many :expenses, dependent: :nullify

  validates :name, presence: true, uniqueness: { scope: :user_id }
end
