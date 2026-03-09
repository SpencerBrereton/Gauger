module Api
  module V1
    class ReconciliationReportsController < BaseController
      before_action :set_report, only: [:show]

      # GET /api/v1/reconciliation_reports
      def index
        reports = current_user.reconciliation_reports.order(period_start: :desc)
        render json: reports
      end

      # GET /api/v1/reconciliation_reports/:id
      def show
        render json: @report
      end

      # POST /api/v1/reconciliation_reports
      def create
        # Auto-calculate totals from expenses and invoices in period if not provided
        report = current_user.reconciliation_reports.build(report_params)

        if report.total_expenses.zero? && report.total_invoiced.zero?
          report.total_expenses = current_user.expenses
            .where(date: report.period_start..report.period_end)
            .sum(:amount)
          report.total_invoiced = current_user.invoices
            .where(billing_period_start: report.period_start..report.period_end)
            .or(current_user.invoices.where(billing_period_start: nil).where(due_date: report.period_start..report.period_end))
            .sum(:amount)
        end

        report.save!
        render json: report, status: :created
      end

      private

      def set_report
        @report = current_user.reconciliation_reports.find(params[:id])
      end

      def report_params
        params.require(:reconciliation_report).permit(
          :period_start, :period_end, :total_expenses, :total_invoiced, :notes
        )
      end
    end
  end
end
