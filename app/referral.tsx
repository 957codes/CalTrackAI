import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useTheme, ThemeColors } from "../src/theme";
import {
  getOrCreateReferralCode,
  buildReferralLink,
} from "../src/services/deepLinking";
import { trackUserAction } from "../src/services/sentry";

export default function ReferralScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getOrCreateReferralCode().then((code) => {
      setReferralCode(code);
      setReferralLink(buildReferralLink(code));
    });
  }, []);

  const handleShare = async () => {
    trackUserAction("referral_share_tapped");
    try {
      await Share.share({
        message: `Track your meals with AI! Try CalTrack AI — snap a photo and get instant calorie counts.\n\n${referralLink}`,
      });
    } catch {
      // User cancelled share
    }
  };

  const handleCopy = async () => {
    trackUserAction("referral_copy_tapped");
    try {
      if (typeof Clipboard.setStringAsync === "function") {
        await Clipboard.setStringAsync(referralLink);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert("Error", "Could not copy to clipboard.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🎁</Text>
        <Text style={styles.heroTitle}>Share CalTrack AI</Text>
        <Text style={styles.heroSubtitle}>
          Invite friends to track their nutrition with AI. Share your personal
          referral link below.
        </Text>
      </View>

      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>Your Referral Code</Text>
        <Text style={styles.codeText}>{referralCode || "..."}</Text>
      </View>

      <View style={styles.linkCard}>
        <Text style={styles.linkLabel}>Your Referral Link</Text>
        <Text style={styles.linkText} numberOfLines={2}>
          {referralLink || "Loading..."}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.shareButton}
        onPress={handleShare}
        activeOpacity={0.8}
      >
        <Text style={styles.shareButtonText}>Share Link</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.copyButton}
        onPress={handleCopy}
        activeOpacity={0.8}
      >
        <Text style={styles.copyButtonText}>
          {copied ? "Copied!" : "Copy Link"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 24,
    },
    hero: {
      alignItems: "center",
      marginTop: 16,
      marginBottom: 32,
    },
    heroEmoji: {
      fontSize: 48,
      marginBottom: 12,
    },
    heroTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 8,
    },
    heroSubtitle: {
      fontSize: 15,
      color: colors.textMuted,
      textAlign: "center",
      lineHeight: 22,
      paddingHorizontal: 16,
    },
    codeCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      alignItems: "center",
      marginBottom: 16,
    },
    codeLabel: {
      fontSize: 13,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    codeText: {
      fontSize: 32,
      fontWeight: "800",
      color: colors.accent,
      letterSpacing: 4,
    },
    linkCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
    },
    linkLabel: {
      fontSize: 13,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    linkText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontFamily: "monospace",
    },
    shareButton: {
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
      marginBottom: 12,
    },
    shareButtonText: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.accentOnAccent,
    },
    copyButton: {
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    copyButtonText: {
      fontSize: 17,
      fontWeight: "600",
      color: colors.text,
    },
  });
}
