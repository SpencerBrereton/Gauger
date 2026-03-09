module Api
  module V1
    class UserProfilesController < BaseController
      # GET /api/v1/user_profile
      def show
        profile = current_user.user_profile || current_user.build_user_profile
        render json: profile.as_json.merge(logo_url: profile.logo.attached? ? url_for(profile.logo) : nil)
      end

      # PATCH/PUT /api/v1/user_profile
      def update
        profile = current_user.user_profile || current_user.build_user_profile
        
        if profile.update(user_profile_params)
          render json: profile.as_json.merge(logo_url: profile.logo.attached? ? url_for(profile.logo) : nil)
        else
          render json: { errors: profile.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def user_profile_params
        params.require(:user_profile).permit(
          :company_name, :company_address, :phone, :user_name, 
          :gst_number, :wcb_number, :default_day_rate, :default_office_rate, :logo
        )
      end
    end
  end
end
