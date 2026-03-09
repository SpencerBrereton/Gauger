module Api
  module V1
    class RegistrationsController < Devise::RegistrationsController
      respond_to :json
      skip_before_action :verify_authenticity_token, raise: false

      private

      def respond_with(resource, _opts = {})
        if resource.persisted?
          render json: {
            message: "Signed up successfully.",
            user: {
              id: resource.id,
              email: resource.email,
              role: resource.role
            }
          }, status: :created
        else
          render json: { errors: resource.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def sign_up_params
        params.require(:user).permit(:email, :password, :password_confirmation, :role)
      end
    end
  end
end
