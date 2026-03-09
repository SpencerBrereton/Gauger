class CreateVehicles < ActiveRecord::Migration[7.2]
  def change
    create_table :vehicles do |t|
      t.string :name
      t.integer :ruleset
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end
  end
end
