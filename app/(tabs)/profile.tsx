import { account, CollectionId, database, DatabaseId } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { Href, Link } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ID, Query } from "react-native-appwrite";
import {
  Button,
  Switch,
  TextInput,
  ActivityIndicator,
  Divider,
  Surface,
} from "react-native-paper";

export default function Profile() {
  const { user, logout } = useAuth();

  // 1. State for all form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [age, setAge] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState(""); // Renamed to avoid collision with React state
  const [pincode, setPincode] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  // 2. Control states
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [docId, setDocId] = useState<string>("");
  const [updated, setUpdated] = useState(false);

  // Theme for TextInputs
  const inputTheme = {
    colors: {
      primary: "#18181c",
      background: "#f7f8fa",
      text: "#191819",
    },
  };

  // --- Data Fetching and Initialization ---
  useEffect(() => {
    if (!user) return;

    const fetchOrCreateProfile = async () => {
      setLoading(true);
      try {
        // Check if profile document exists for this user's email
        const resp = await database.listDocuments(
          DatabaseId,
          CollectionId,
          [Query.equal("email", user.email)]
        );

        if (resp.documents.length > 0) {
          // Document found: Load existing data
          const data = resp.documents[0];
          setDocId(data.$id);
          setName(data.name ?? user.name ?? "");
          setEmail(data.email ?? user.email ?? "");
          setMobile(data.mobile ?? "");
          setAge(data.age?.toString() ?? "");
          setAddress(data.address ?? "");
          setCity(data.city ?? "");
          setStateName(data.state ?? ""); 
          setPincode(data.pincode ?? "");
          setIsPublic(data.isPublic ?? true);
        } else {
          // No document found: Create a new one
          const newDoc = await database.createDocument(
            DatabaseId,
            CollectionId,
            ID.unique(),
            {
              name: user.name,
              email: user.email,
              isPublic: true,
            }
          );
          setDocId(newDoc.$id);
          setName(user.name ?? "");
          setEmail(user.email ?? "");
          setIsPublic(true);
          // Other fields remain empty strings
        }
      } catch (err) {
        console.error("Profile Fetch/Create Error:", err);
        Alert.alert("Error", "Failed to load profile data.");
      }
      setLoading(false);
    };
    fetchOrCreateProfile();
  }, [user]);

  // --- Handlers ---
  const handleUpdate = async () => {
    if (!docId) {
      Alert.alert("Error", "Profile document ID missing.");
      return;
    }
    setLoading(true);
    try {
      await database.updateDocument(DatabaseId, CollectionId, docId, {
        name: name,
        mobile: mobile,
        age: Number(age) || 0,
        address: address,
        city: city,
        state: stateName,
        pincode: pincode,
        isPublic: isPublic,
      });

      // Update Appwrite auth name if changed
      if (name && name !== user?.name) {
        await account.updateName(name);
      }

      setEditMode(false);
      setUpdated(true);
      setTimeout(() => setUpdated(false), 1800);
    } catch (err: any) {
      Alert.alert("Update failed", err.message || "Unknown error");
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      Alert.alert("Logout Error", "Failed to logout.");
    }
  };

  const handleResetPassword = async () => {
    try {
      // Ensure the deep link is correct for your setup
      await account.createRecovery(email, `${Link.resolveHref('/(auth)/reset-password' as Href)}`);
      Alert.alert("Recovery Email Sent", "Check your email for password reset link.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not send password reset email.");
    }
  };

  // --- Loading State ---
  if (loading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} color="#18181c" size="large" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // --- Helper function for Display Mode (Inline replacement for ProfileField) ---
  const renderDisplayField = (label: string, value: string | boolean) => (
    <View key={label} style={styles.fieldPair}>
      <Text style={styles.displayLabel}>{label}</Text>
      {typeof value === 'boolean' ? (
        <Switch value={value} color="#222" disabled />
      ) : (
        <Text style={styles.displayValue}>{value ? value : "—"}</Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Surface style={styles.card}>
          <Text style={styles.sectionTitle}>My Profile</Text>
          {updated && (
            <Text style={styles.updatedMessage}>Profile Updated! 🎉</Text>
          )}

          {/* --- Display Mode --- */}
          {!editMode ? (
            <>
              {renderDisplayField("Name", name)}
              <Divider style={styles.divider} />
              {renderDisplayField("Email", email)}
              <Divider style={styles.divider} />
              {renderDisplayField("Mobile", mobile)}
              <Divider style={styles.divider} />
              {renderDisplayField("Age", age)}
              <Divider style={styles.divider} />
              {renderDisplayField("Address", address)}
              <Divider style={styles.divider} />
              {renderDisplayField("City", city)}
              <Divider style={styles.divider} />
              {renderDisplayField("State", stateName)}
              <Divider style={styles.divider} />
              {renderDisplayField("Pincode", pincode)}
              <Divider style={styles.divider} />
              {renderDisplayField("Show to Public", isPublic)}

              <Button
                mode="contained"
                style={styles.editBtn}
                labelStyle={styles.editBtnText}
                onPress={() => setEditMode(true)}
              >
                Edit Details
              </Button>
              <Button
                mode="outlined"
                style={styles.logoutBtn}
                labelStyle={styles.logoutBtnText}
                onPress={handleLogout}
              >
                Logout
              </Button>
              <Button
                mode="text"
                style={styles.resetBtn}
                labelStyle={styles.resetBtnText}
                onPress={handleResetPassword}
              >
                Change Password
              </Button>
            </>
          ) : (
            /* --- Edit Mode --- */
            <>
              <TextInput
                label="Name"
                value={name}
                onChangeText={setName}
                style={styles.input}
                theme={inputTheme}
                mode="outlined"
              />
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                editable={false}
                style={styles.input}
                theme={inputTheme}
                mode="outlined"
              />
              <TextInput
                label="Mobile"
                value={mobile}
                onChangeText={setMobile}
                keyboardType="phone-pad"
                style={styles.input}
                theme={inputTheme}
                mode="outlined"
              />
              <TextInput
                label="Age"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                style={styles.input}
                theme={inputTheme}
                mode="outlined"
              />
              <TextInput
                label="Address"
                value={address}
                onChangeText={setAddress}
                multiline
                style={styles.input}
                theme={inputTheme}
                mode="outlined"
              />
              <TextInput
                label="City"
                value={city}
                onChangeText={setCity}
                style={styles.input}
                theme={inputTheme}
                mode="outlined"
              />
              <TextInput
                label="State"
                value={stateName}
                onChangeText={setStateName}
                style={styles.input}
                theme={inputTheme}
                mode="outlined"
              />
              <TextInput
                label="Pincode"
                value={pincode}
                onChangeText={setPincode}
                keyboardType="numeric"
                style={styles.input}
                theme={inputTheme}
                mode="outlined"
              />

              <View style={styles.publicRow}>
                <Text style={styles.displayLabel}>Show to Public</Text>
                <Switch
                  value={isPublic}
                  onValueChange={setIsPublic}
                  color="#191819"
                />
              </View>

              <Button
                mode="contained"
                style={styles.updateBtn}
                labelStyle={styles.updateBtnText}
                onPress={handleUpdate}
                disabled={loading}
              >
                {loading ? "Saving..." : "Update"}
              </Button>
              <Button
                mode="outlined"
                style={styles.logoutBtn}
                labelStyle={styles.logoutBtnText}
                onPress={handleLogout}
              >
                Logout
              </Button>
              <Button
                mode="text"
                style={{ marginTop: 2 }}
                onPress={() => setEditMode(false)}
              >
                Cancel
              </Button>
            </>
          )}
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Simplified Styles
const styles = StyleSheet.create({
  scroll: {
    backgroundColor: "#f7f8fa",
    alignItems: "center",
    paddingVertical: 20,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f7f8fa",
  },
  loadingText: {
    color: "#131313",
    fontWeight: "600",
    fontSize: 18,
    marginTop: 10,
  },
  updatedMessage: {
    alignSelf: "center",
    color: "#239d11",
    fontWeight: "600",
    fontSize: 15,
    paddingBottom: 8,
  },
  card: {
    width: "95%",
    maxWidth: 430,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#18171b",
    marginBottom: 20,
  },
  divider: {
    backgroundColor: "#eceeef",
    height: 1,
    marginVertical: 1,
  },
  fieldPair: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  displayLabel: {
    color: "#5b5e6d",
    fontSize: 16,
    fontWeight: "500",
  },
  displayValue: {
    color: "#17181b",
    fontSize: 16,
    fontWeight: "600",
    maxWidth: "60%",
    textAlign: "right",
  },
  publicRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 5,
    marginBottom: 20,
    paddingHorizontal: 1,
  },
  input: {
    marginBottom: 15,
    backgroundColor: "#f7f8fa",
    borderRadius: 10,
    fontSize: 16,
    height: 55,
  },
  editBtn: {
    backgroundColor: "#18181c",
    borderRadius: 12,
    minHeight: 50,
    marginTop: 20,
    marginBottom: 8,
    elevation: 0,
    justifyContent: "center",
  },
  editBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  updateBtn: {
    backgroundColor: "#191819",
    borderRadius: 12,
    marginTop: 15,
    marginBottom: 7,
    elevation: 0,
    minHeight: 50,
    justifyContent: "center",
  },
  updateBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  logoutBtn: {
    borderRadius: 12,
    borderColor: "#232426",
    borderWidth: 1.5,
    backgroundColor: "#f9f9fa",
    minHeight: 50,
    marginBottom: 9,
    marginTop: 2,
    elevation: 0,
    justifyContent: "center",
  },
  logoutBtnText: {
    color: "#1b1b1c",
    fontWeight: "700",
    fontSize: 16,
  },
  resetBtn: {
    marginTop: 5,
  },
  resetBtnText: {
    color: "#2d2d2d",
    fontWeight: "700",
    fontSize: 15,
  },
});