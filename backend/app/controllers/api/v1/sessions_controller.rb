module Api
  module V1
    class SessionsController < Devise::SessionsController
      respond_to :json
      skip_before_action :verify_authenticity_token, raise: false

      private

      def respond_with(resource, _opts = {})
        render json: {
          message: "Signed in successfully.",
          user: {
            id: resource.id,
            email: resource.email,
            role: resource.role
          }
        }, status: :ok
      end

      def respond_to_on_destroy
        if current_user
          render json: { message: "Signed out successfully." }, status: :ok
        else
          render json: { message: "No active session." }, status: :ok
        end
      end
    end
  end
end
