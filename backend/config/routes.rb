Rails.application.routes.draw do
  # Devise JWT routes (login/logout/register)
  devise_for :users,
             path: "api/v1/users",
             path_names: {
               sign_in: "sign_in",
               sign_out: "sign_out",
               registration: "sign_up"
             },
             controllers: {
               sessions: "api/v1/sessions",
               registrations: "api/v1/registrations"
             }

  namespace :api do
    namespace :v1 do
      resources :expenses do
        collection do
          post :extract_receipt, to: "receipt_extractions#create"
        end
        resources :receipts, only: [:create, :show, :destroy]
      end
      resources :invoices
      resources :categories
      resources :vehicles
      resources :clients
      resource :user_profile, only: [:show, :update]
      get "user_profile/logo", to: "logo_proxy#show"
      resources :reconciliation_reports, only: [:index, :show, :create]

      resources :mileage_logs do
        collection do
          post :extract_gas_receipt, to: "gas_receipt_extractions#create"
        end
        resources :receipts, controller: 'gas_receipts', only: [:create, :show, :destroy]
      end
    end
  end

  # Health check
  get "/up", to: proc { [200, {}, ["OK"]] }
end
