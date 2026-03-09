class ApplicationController < ActionController::API
  before_action :authenticate_user!

  def authenticate_user!
    super
  rescue JWT::DecodeError => e
    render json: { error: "Invalid token: #{e.message}" }, status: :unauthorized
  end

  private

  def pagination_meta(collection)
    {
      current_page: collection.try(:current_page),
      total_pages: collection.try(:total_pages),
      total_count: collection.try(:total_count)
    }
  end
end
