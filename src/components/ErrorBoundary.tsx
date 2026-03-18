import React, { Component, type ErrorInfo, type ReactNode } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Sentry } from "../services/sentry";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, {
      extra: { componentStack: errorInfo.componentStack },
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            We've been notified and are looking into it.
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
            <Text style={styles.buttonText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f23",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  button: {
    backgroundColor: "#4ade80",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f0f23",
  },
});
