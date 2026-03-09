class CreateClients < ActiveRecord::Migration[7.2]
  def change
    create_table :clients do |t|
      t.string :name
      t.string :address
      t.string :default_project_manager
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end
  end
end
