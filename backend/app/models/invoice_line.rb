class InvoiceLine < ApplicationRecord
  belongs_to :invoice
  belongs_to :expense, optional: true
  belongs_to :mileage_log, optional: true
end
