class CreateUsers < ActiveRecord::Migration[7.1]
  def change
    create_table :users do |t|
      ## Devise Database Authenticatable
      t.string :email,              null: false, default: ""
      t.string :encrypted_password, null: false, default: ""

      ## Devise Recoverable
      t.string   :reset_password_token
      t.datetime :reset_password_sent_at

      ## Devise Trackable
      t.datetime :remember_created_at

      ## Role
      t.integer :role, null: false, default: 0

      ## JWT Revocation (JTIMatcher)
      t.string :jti, null: false

      t.timestamps null: false
    end

    add_index :users, :email,                unique: true
    add_index :users, :reset_password_token, unique: true
    add_index :users, :jti,                  unique: true
  end
end
