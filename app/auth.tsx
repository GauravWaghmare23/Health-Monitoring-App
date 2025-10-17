import { useAuth } from "@/lib/auth-context";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { AppwriteException } from "react-native-appwrite";
import { Button, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Auth() {
  const [isSignup, setIsSignup] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");
  const { signUp, signIn } = useAuth();

  const onToggle = () => {
    setError("");
    setIsSignup((prev) => !prev);
  };

  const onSubmit = async () => {
    setSuccess("");
    setError("");
    try {
      if (isSignup) {
        await signUp(name, email, password);
        setSuccess("Account created successfully!");
      } else {
        await signIn(email, password);
      }
    } catch (e) {
      if (e instanceof AppwriteException) {
        if (isSignup) {
          if (e.code === 409) setError("A user with this email already exists.");
          else setError(e.message);
        } else {
          if (e.code === 401) setError("Invalid email or password.");
          else setError(e.message);
        }
      } else setError("An unknown error occurred");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Toggle tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[
            styles.tab,
            !isSignup && styles.activeTab,
          ]}
          activeOpacity={0.8}
          onPress={() => { if (isSignup) onToggle(); }}
        >
          <Text style={[styles.tabText, !isSignup && styles.activeTabText]}>
            Login
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            isSignup && styles.activeTab,
          ]}
          activeOpacity={0.8}
          onPress={() => { if (!isSignup) onToggle(); }}
        >
          <Text style={[styles.tabText, isSignup && styles.activeTabText]}>
            Sign Up
          </Text>
        </TouchableOpacity>
      </View>

      {/* Card for Inputs */}
      <View style={styles.formCard}>
        {isSignup && (
          <TextInput
            label="Name"
            value={name}
            onChangeText={setName}
            style={styles.input}
            mode="outlined"
            autoCapitalize="words"
          />
        )}
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          mode="outlined"
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
          mode="outlined"
        />
        {success !== "" && <Text style={styles.successText}>{success}</Text>}
        {error !== "" && <Text style={styles.errorText}>{error}</Text>}

        <Button mode="contained" onPress={onSubmit} style={styles.button}>
          {isSignup ? "Sign Up" : "Log In"}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#f9fafb",
    paddingHorizontal: 14,
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 13,
    marginTop: 30,
    marginBottom: 24,
    alignSelf: "center",
    width: "98%",
    borderWidth: 2,
    borderColor: "#18181c",
    overflow: "hidden",    
    boxShadow: "0 2px 8px rgba(24, 24, 24, 0.1)",
  },
  tab: {
    flex: 1,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderColor: "#eaeaea",
    backgroundColor: "#fff",
  },
  activeTab: {
    backgroundColor: "#18181c",
    borderColor: "#18181c",
    borderRightWidth: 0,
  },
  tabText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#888",
  },
  activeTabText: {
    fontWeight: "700",
    color: "#fff",
    fontSize: 19,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 2,    
    boxShadow: "0 6px 16px rgba(34, 34, 34, 0.14)",
    marginBottom: 13,
  },
  input: {
    marginBottom: 14,
  },
  button: {
    marginTop: 17,
    height: 48,
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#18181c",
  },
  errorText: {
    color: "#e60b2f",
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "600",
    fontSize: 15,
    marginTop: 1,
  },
  successText: {
    color: "#239d11",
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "600",
    fontSize: 15,
    marginTop: 1,
  },
});
