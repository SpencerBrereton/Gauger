module Api
  module V1
    class CategoriesController < BaseController
      before_action :set_category, only: [:show, :update, :destroy]

      # GET /api/v1/categories
      def index
        categories = current_user.categories.order(:name)
        render json: categories.map { |c| c.as_json.merge(expenses_count: c.expenses.count) }
      end

      # GET /api/v1/categories/:id
      def show
        render json: @category
      end

      # POST /api/v1/categories
      def create
        category = current_user.categories.create!(category_params)
        render json: category, status: :created
      end

      # PATCH/PUT /api/v1/categories/:id
      def update
        @category.update!(category_params)
        render json: @category
      end

      # DELETE /api/v1/categories/:id
      def destroy
        @category.destroy!
        head :no_content
      end

      private

      def set_category
        @category = current_user.categories.find(params[:id])
      end

      def category_params
        params.require(:category).permit(:name)
      end
    end
  end
end
