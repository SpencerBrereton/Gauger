import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import useAuthStore from "../store/authStore";
import storage from "../utils/storage";
import { THEME } from "../theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const { signIn, signUp, isLoading } = useAuthStore();

  useEffect(() => {
    const loadCredentials = async () => {
      const savedEmail = await storage.getItem("saved_email");
      const savedPassword = await storage.getItem("saved_password");
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
      if (savedPassword) {
        setPassword(savedPassword);
      }
    };
    loadCredentials();
  }, []);

  const handleRememberMe = async (emailToSave, passwordToSave) => {
    if (rememberMe) {
      await storage.setItem("saved_email", emailToSave);
      await storage.setItem("saved_password", passwordToSave);
    } else {
      await storage.removeItem("saved_email");
      await storage.removeItem("saved_password");
    }
  };

  const clearErrors = () => {
    setErrorMsg("");
    setFieldErrors({});
  };

  const handleSubmit = async () => {
    clearErrors();

    const trimmedEmail = email.trim();
    setEmail(trimmedEmail);

    // Basic client-side validation
    let hasFieldErrors = false;
    const newFieldErrors = {};

    if (!trimmedEmail) {
      newFieldErrors.email = "Email is required";
      hasFieldErrors = true;
    }
    if (!password) {
      newFieldErrors.password = "Password is required";
      hasFieldErrors = true;
    }

    if (isSignUp) {
      if (password !== passwordConfirmation) {
        newFieldErrors.passwordConfirmation = "Passwords do not match";
        hasFieldErrors = true;
      }
      if (password.length > 0 && password.length < 6) {
        newFieldErrors.password = "Password must be at least 6 characters";
        hasFieldErrors = true;
      }
    }

    if (hasFieldErrors) {
      setFieldErrors(newFieldErrors);
      return;
    }

    if (isSignUp) {
      const result = await signUp(trimmedEmail, password, passwordConfirmation);
      if (!result.success) {
        if (Array.isArray(result.errors)) {
          const mappedErrors = {};
          result.errors.forEach(err => {
            if (err.toLowerCase().includes("email")) mappedErrors.email = err;
            else if (err.toLowerCase().includes("password confirmation")) mappedErrors.passwordConfirmation = err;
            else if (err.toLowerCase().includes("password")) mappedErrors.password = err;
            else setErrorMsg(err);
          });
          setFieldErrors(mappedErrors);
        } else {
          setErrorMsg("Sign Up Failed. Please try again.");
        }
      } else {
        await handleRememberMe(trimmedEmail, password);
      }
    } else {
      const result = await signIn(trimmedEmail, password);
      if (!result.success) {
        // Devise usually returns a generic "Invalid email or password"
        setErrorMsg(result.error || "Sign In Failed");
        setFieldErrors({
          email: " ", // Just highlight red without redundant text
          password: " "
        });
      } else {
        await handleRememberMe(trimmedEmail, password);
      }
    }
  };

  const getInputStyle = (fieldName) => {
    return [
      styles.input,
      fieldErrors[fieldName] && styles.inputError
    ];
  };

  const getPasswordContainerStyle = (fieldName) => {
    return [
      styles.passwordContainer,
      fieldErrors[fieldName] && styles.inputError
    ];
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.card}>
        <Text style={styles.logo}>Gauger</Text>
        <Text style={styles.subtitle}>Expense Tracking</Text>

        {!!errorMsg && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorMsg}</Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={getInputStyle("email")}
            value={email}
            onChangeText={(text) => { setEmail(text); if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: null })); }}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            blurOnSubmit={false}
            placeholder="Work email"
            placeholderTextColor={THEME.muted}
            testID="login-email-input"
          />
          {!!fieldErrors.email && (
            <Text style={styles.fieldErrorText}>{fieldErrors.email}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={getPasswordContainerStyle("password")}>
            <TextInput
              ref={passwordRef}
              style={styles.passwordInput}
              value={password}
              onChangeText={(text) => { setPassword(text); if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: null })); }}
              secureTextEntry={!showPassword}
              returnKeyType={isSignUp ? "next" : "done"}
              onSubmitEditing={isSignUp ? () => confirmPasswordRef.current?.focus() : handleSubmit}
              placeholder="Your password"
              placeholderTextColor={THEME.muted}
              testID="login-password-input"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
            >
              <Text style={styles.eyeText}>{showPassword ? "Hide" : "Show"}</Text>
            </TouchableOpacity>
          </View>
          {!!fieldErrors.password && (
            <Text style={styles.fieldErrorText}>{fieldErrors.password}</Text>
          )}
        </View>

        {isSignUp && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={getPasswordContainerStyle("passwordConfirmation")}>
              <TextInput
                ref={confirmPasswordRef}
                style={styles.passwordInput}
                value={passwordConfirmation}
                onChangeText={(text) => { setPasswordConfirmation(text); if (fieldErrors.passwordConfirmation) setFieldErrors(prev => ({ ...prev, passwordConfirmation: null })); }}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                placeholder="Match your password"
                placeholderTextColor={THEME.muted}
                testID="login-confirm-password-input"
              />
            </View>
            {!!fieldErrors.passwordConfirmation && (
              <Text style={styles.fieldErrorText}>{fieldErrors.passwordConfirmation}</Text>
            )}
          </View>
        )}

        <View style={styles.rememberRow}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setRememberMe(!rememberMe)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
              {rememberMe && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.rememberText}>Remember me</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={isLoading}
          testID="login-submit-button"
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{isSignUp ? "Create Account" : "Sign In"}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => {
          setIsSignUp(!isSignUp);
          clearErrors();
        }} style={styles.toggle}>
          <Text style={styles.toggleText}>
            {isSignUp ? "Already have an account? Sign in" : "No account? Sign up"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 28,
    width: "100%",
    maxWidth: 420,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  logo: {
    fontSize: 32,
    fontWeight: "800",
    color: THEME.primary,
    textAlign: "center",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    color: THEME.muted,
    textAlign: "center",
    marginBottom: 24,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  errorBanner: {
    backgroundColor: THEME.dangerLight,
    borderColor: THEME.dangerBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorBannerText: {
    color: THEME.danger,
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.textSecondary,
    marginBottom: 6,
    marginLeft: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: THEME.input,
    color: THEME.text,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: THEME.border,
  },
  inputError: {
    borderColor: THEME.danger,
    backgroundColor: "#FFF5F5",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.input,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: THEME.border,
  },
  passwordInput: {
    flex: 1,
    color: THEME.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  eyeText: {
    color: THEME.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  fieldErrorText: {
    color: THEME.danger,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
    fontWeight: "500",
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: -4,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: THEME.border,
    borderRadius: 6,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.input,
  },
  checkboxActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
    marginTop: -1,
  },
  rememberText: {
    color: THEME.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
  button: {
    backgroundColor: THEME.primary,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  toggle: {
    marginTop: 24,
    alignItems: "center",
  },
  toggleText: {
    color: THEME.primary,
    fontSize: 14,
    fontWeight: "600",
  },
});
