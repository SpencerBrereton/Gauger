class CreateUserProfiles < ActiveRecord::Migration[7.2]
  def change
    create_table :user_profiles do |t|
      t.string :company_name
      t.string :company_address
      t.string :phone
      t.string :user_name
      t.string :gst_number
      t.string :wcb_number
      t.decimal :default_day_rate
      t.decimal :default_office_rate
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end
  end
end
