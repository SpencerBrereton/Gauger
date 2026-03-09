module Api
  module V1
    class LogoProxyController < BaseController
      def show
        profile = current_user.user_profile
        unless profile&.logo&.attached?
          return head :not_found
        end

        blob = profile.logo.blob
        data = blob.download
        send_data data, type: blob.content_type, disposition: "inline"
      end
    end
  end
end
