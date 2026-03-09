class CreateMileageLogs < ActiveRecord::Migration[7.2]
  def change
    create_table :mileage_logs do |t|
      t.references :user, null: false, foreign_key: true
      t.references :vehicle, null: true, foreign_key: true
      t.date :date
      t.integer :current_odometer
      t.string :destination
      t.string :purpose
      t.decimal :gasoline_litres, precision: 10, scale: 2
      t.decimal :subtotal, precision: 10, scale: 2
      t.decimal :tax, precision: 10, scale: 2
      t.decimal :total_cost, precision: 10, scale: 2

      t.timestamps
    end
  end
end
