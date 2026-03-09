// Gauger App Theme
// Clean, bright, professional — built for contractors on the go.
//
// Primary brand: Gauger Orange (#F6821F)
// Background: Soft warm white (#FAFAFA) with crisp white cards
// Typography: Near-black for body, medium gray for labels/metadata
// Borders: Subtle light gray — visible but never heavy

export const THEME = {
  // Brand
  primary: "#018e40ff",
  primaryLight: "#FFF3E8",   // tinted bg for unlock/warning banners
  primaryBorder: "#FED7AA",  // border to pair with primaryLight

  // Backgrounds
  bg: "#F7F8FA",             // page background — slightly warm, not pure gray
  card: "#FFFFFF",           // card / surface background

  // Typography
  text: "#111827",           // primary body text — near black, crisp
  textSecondary: "#374151",  // slightly softer for secondary body copy
  muted: "#6B7280",          // labels, metadata, placeholders

  // Borders & Dividers
  border: "#E5E7EB",         // subtle card/input borders
  divider: "#F3F4F6",        // very subtle inset dividers

  // Inputs
  input: "#FFFFFF",          // input background
  inputDisabled: "#F9FAFB",  // locked/disabled input background
  inputDisabledText: "#9CA3AF",

  // Navigation
  inactive: "#9CA3AF",       // tab bar inactive icon color

  // Semantic / Status
  danger: "#EF4444",
  dangerLight: "#FEF2F2",
  dangerBorder: "#FECACA",
  success: "#16A34A",
  successLight: "#F0FDF4",
  warning: "#D97706",
  warningLight: "#FEF3C7",
  warningBorder: "#FDE68A",
  info: "#2563EB",

  // Feature-specific accent tints (icon wrappers, etc.)
  expenseAccent: "#FFF7ED",
  invoiceAccent: "#EFF6FF",
  mileageAccent: "#F5F3FF",
};

// Status color maps — exported for reuse
export const EXPENSE_STATUS_COLORS = {
  pending: "#D97706",
  approved: "#16A34A",
  rejected: "#EF4444",
};

export const INVOICE_STATUS_COLORS = {
  sent: "#2563EB",
  paid: "#16A34A",
  overdue: "#EF4444",
};

// Shared style fragments — import and spread these for consistency
export const sharedStyles = {
  // Field label above inputs
  fieldLabel: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },

  // Standard single-line text input
  input: {
    backgroundColor: "#FFFFFF",
    color: "#111827",
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  // Locked / read-only input override
  inputLocked: {
    backgroundColor: "#F9FAFB",
    color: "#9CA3AF",
    borderColor: "#E5E7EB",
  },

  // Primary action button
  primaryBtn: {
    backgroundColor: "#F6821F",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // Outline / secondary button
  outlineBtn: {
    backgroundColor: "transparent",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineBtnText: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "600",
  },

  // Card surface
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  // Section header label (ALL CAPS, muted)
  sectionLabel: {
    color: "#6B7280",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },

  // Floating action button
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#F6821F",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#F6821F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
};
