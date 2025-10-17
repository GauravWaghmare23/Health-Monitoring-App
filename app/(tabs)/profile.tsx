import { account, CollectionId, database, DatabaseId } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { Href, Link } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { ID, Query } from "appwrite";
import {
    Button,
    Divider,
    Surface,
    Switch,
    TextInput,
} from "react-native-paper";

const SCREEN_WIDTH = Dimensions.get("window").width;

type State = {
  name: string;
  email: string;
  mobile: string;
  age: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isPublic: boolean;
};

type Action = { type: "SET_FIELD"; field: keyof State; payload: any } | { type: "SET_STATE"; payload: Partial<State> };

const formReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.payload };
    case "SET_STATE":
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

export default function Profile() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [docId, setDocId] = useState<string>("");
  const [formState, dispatch] = React.useReducer(formReducer, { name: "", email: "", mobile: "", age: "", address: "", city: "", state: "", pincode: "", isPublic: true });

  // For displaying update status
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchOrCreateProfile = async () => {
      setLoading(true);
      try {
        const resp = await database.listDocuments(
          DatabaseId,
          CollectionId,
          [Query.equal("email", user.email)]
        );
        if (resp.documents.length > 0) {
          const data = resp.documents[0];
          setDocId(data.$id);
          dispatch({ type: "SET_STATE", payload: {
            name: user.name ?? "",
            email: user.email ?? "",
            mobile: data.mobile ?? "",
            age: data.age?.toString() ?? "",
            address: data.address ?? "",
            city: data.city ?? "",
            state: data.state ?? "",
            pincode: data.pincode ?? "",
            isPublic: data.isPublic ?? true,
          }});
        } else {
          const newDoc = await database.createDocument(DatabaseId, CollectionId, ID.unique(), {
            name: user.name,
            email: user.email,
            isPublic: true,
          });
          setDocId(newDoc.$id);
          dispatch({ type: "SET_STATE", payload: {
            name: user.name ?? "",
            email: user.email ?? "",
            mobile: newDoc.mobile ?? "",
            age: newDoc.age?.toString() ?? "",
            address: newDoc.address ?? "",
            city: newDoc.city ?? "",
            state: newDoc.state ?? "",
            pincode: newDoc.pincode ?? "",
            isPublic: newDoc.isPublic ?? true,
          }});
        }
      } catch (err) {
        Alert.alert("Error", "Failed to fetch or create profile data.");
      }
      setLoading(false);
    };
    fetchOrCreateProfile();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      Alert.alert("Logout Error", "Failed to logout. Please try again.");
    }
  };

  const handleUpdate = async () => {
    if (!docId) {
      Alert.alert("Error", "Profile document ID missing.");
      return;
    }
    try {
      await database.updateDocument(DatabaseId, CollectionId, docId, {
        name: formState.name,
        email: formState.email,
        mobile: formState.mobile,
        age: Number(formState.age) || 0,
        address: formState.address,
        city: formState.city,
        state: formState.state,
        pincode: formState.pincode,
        isPublic: formState.isPublic,
      });
      // Only update name in auth service if it's not empty and has changed
      if (formState.name && formState.name !== user?.name) {
        await account.updateName(formState.name);
      }
      setEdit(false);
      setUpdated(true);
      setTimeout(() => setUpdated(false), 1800);
    } catch (err: any) {
      Alert.alert("Update failed", err.message || "Unknown error");
    }
  };

  const handleResetPassword = async () => {
    try {
      // This URL must be a configured deep link in your app.json/expo config.
      // For example: "exp://192.168.1.10:8081/--/reset-password"
      // You would then create a [..reset-password].tsx file to handle the logic.
      await account.createRecovery(formState.email, `${Link.resolveHref('/(auth)/reset-password' as Href)}`);
      Alert.alert("Recovery Email Sent", "Check your email for password reset link.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not send password reset email.");
    }
  };

  if (!user || loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Surface style={styles.card}>
          <Text style={styles.sectionTitle}>My Profile</Text>
          {updated && (
            <Text style={styles.updatedMessage}>Profile Updated!</Text>
          )}
          {!edit ? (
            <>
              <View style={styles.bigFieldRow}>
                <View style={{ width: "50%" }}>
                  <Text style={styles.displayLabel}>Name</Text>
                  <Text style={styles.displayValue}>{formState.name}</Text>
                </View>
                <View style={{ width: "50%" }}>
                  <Text style={styles.displayLabel}>Email</Text>
                  <Text style={styles.displayValue}>{formState.email}</Text>
                </View>
              </View>
              <Divider style={styles.divider} />
              <View style={styles.multiRow}>
                <ProfileField label="Mobile" value={formState.mobile} />
                <ProfileField label="Age" value={formState.age} />
              </View>
              <Divider style={styles.divider} />
              <ProfileField label="Address" value={formState.address} />
              <ProfileField label="City" value={formState.city} />
              <ProfileField label="State" value={formState.state} />
              <ProfileField label="Pincode" value={formState.pincode} />
              <Divider style={styles.divider} />
              <View style={styles.publicRow}>
                <Text style={styles.displayLabel}>Show to Public</Text>
                <Switch value={formState.isPublic} color="#222" disabled />
              </View>
              <Button
                mode="contained"
                style={styles.editBtn}
                labelStyle={styles.editBtnText}
                contentStyle={styles.buttonContent}
                onPress={() => setEdit(true)}
              >
                Edit Details
              </Button>
              <Button
                mode="outlined"
                style={styles.logoutBtn}
                labelStyle={styles.logoutBtnText}
                contentStyle={styles.buttonContent}
                onPress={handleLogout}
              >
                Logout
              </Button>
              <Button
                mode="text"
                style={styles.resetBtn}
                labelStyle={styles.resetBtnText}
                onPress={handleResetPassword}
                contentStyle={styles.buttonContent}
              >
                Change Password
              </Button>
            </>
          ) : (
            <>
              <BigTextInput label="Name" value={formState.name} onChangeText={(text: string) => dispatch({ type: 'SET_FIELD', field: 'name', payload: text })} />
              <BigTextInput label="Email" value={formState.email} onChangeText={(text: string) => dispatch({ type: 'SET_FIELD', field: 'email', payload: text })} keyboardType="email-address" editable={false} />
              <BigTextInput label="Mobile" value={formState.mobile} onChangeText={(text: string) => dispatch({ type: 'SET_FIELD', field: 'mobile', payload: text })} keyboardType="phone-pad" />
              <BigTextInput label="Age" value={formState.age} onChangeText={(text: string) => dispatch({ type: 'SET_FIELD', field: 'age', payload: text })} keyboardType="numeric" />
              <BigTextInput label="Address" value={formState.address} onChangeText={(text: string) => dispatch({ type: 'SET_FIELD', field: 'address', payload: text })} multiline />
              <BigTextInput label="City" value={formState.city} onChangeText={(text: string) => dispatch({ type: 'SET_FIELD', field: 'city', payload: text })} />
              <BigTextInput label="State" value={formState.state} onChangeText={(text: string) => dispatch({ type: 'SET_FIELD', field: 'state', payload: text })} />
              <BigTextInput label="Pincode" value={formState.pincode} onChangeText={(text: string) => dispatch({ type: 'SET_FIELD', field: 'pincode', payload: text })} keyboardType="numeric" />
              <View style={styles.publicRow}>
                <Text style={styles.displayLabel}>Show to Public</Text>
                <Switch value={formState.isPublic} onValueChange={(val) => dispatch({ type: 'SET_FIELD', field: 'isPublic', payload: val })} color="#191819" />
              </View>
              <Button
                mode="contained"
                style={styles.updateBtn}
                labelStyle={styles.updateBtnText}
                contentStyle={styles.buttonContent}
                onPress={handleUpdate}
              >
                Update
              </Button>
              <Button
                mode="outlined"
                style={styles.logoutBtn}
                labelStyle={styles.logoutBtnText}
                contentStyle={styles.buttonContent}
                onPress={handleLogout}
              >
                Logout
              </Button>
              <Button
                mode="text"
                style={{ marginTop: 2 }}
                onPress={() => setEdit(false)}
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

// Field Display Helper
function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fieldPair}>
      <Text style={styles.displayLabel}>{label}</Text>
      <Text style={styles.displayValue}>{value ? value : "—"}</Text>
    </View>
  );
}

// Oversized Input Helper
function BigTextInput(props: any) {
  return (
    <TextInput
      {...props}
      style={[styles.bigInput, props.style]}
      theme={inputTheme}
      mode="outlined"
    />
  );
}

const inputTheme = {
  colors: {
    primary: "#222",
    background: "#f7f8fa",
    text: "#191819",
    placeholder: "#a5acba",
  },
};

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
    backgroundColor: "#f2f3f9",
  },
  loadingText: {
    color: "#131313",
    fontWeight: "600",
    fontSize: 22,
  },
  updatedMessage: {
    alignSelf: "center",
    color: "#239d11",
    fontWeight: "600",
    fontSize: 15,
    paddingBottom: 8,
  },
  card: {
    width: SCREEN_WIDTH < 430 ? "98%" : 430,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 26,    
    boxShadow: "0 7px 15px rgba(34, 34, 34, 0.12)",
    marginBottom: 20,
    alignSelf: "center",
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#18171b",
    marginBottom: 22,
    letterSpacing: 0.15,
  },
  divider: {
    backgroundColor: "#eceeef",
    height: 1,
    marginVertical: 9,
    width: "100%",
    alignSelf: "center",
  },
  bigFieldRow: {
    flexDirection: "row",
    marginBottom: 2,
    alignItems: "flex-start",
  },
  multiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 0,
  },
  fieldPair: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 0,
    marginBottom: 0,
  },
  displayLabel: {
    color: "#5b5e6d",
    fontSize: 17,
    fontWeight: "500",
  },
  displayValue: {
    color: "#17181b",
    fontSize: 17,
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
  editBtn: {
    backgroundColor: "#18181c",
    borderRadius: 20,
    minHeight: 56,
    marginTop: 19,
    marginBottom: 6,
    elevation: 0,
    fontWeight: "700",
    fontSize: 19,
    justifyContent: "center",
  },
  editBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 19,
  },
  logoutBtn: {
    borderRadius: 20,
    borderColor: "#232426",
    borderWidth: 1.5,
    backgroundColor: "#f9f9fa",
    minHeight: 56,
    marginBottom: 9,
    marginTop: 2,
    elevation: 0,
  },
  logoutBtnText: {
    color: "#1b1b1c",
    fontWeight: "700",
    fontSize: 17,
  },
  bigInput: {
    marginBottom: 17,
    backgroundColor: "#f7f8fa",
    borderRadius: 14,
    fontSize: 19,
    height: 59,
    paddingLeft: 12,
    paddingTop: 10,
    borderColor: "#e1e2e6",
    borderWidth: 1.1,
  },
  updateBtn: {
    backgroundColor: "#191819",
    borderRadius: 18,
    marginTop: 10,
    marginBottom: 7,
    elevation: 0,
    width: "100%",
    minHeight: 55,
    justifyContent: "center",
  },
  updateBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },
  resetBtn: {
    marginTop: 5,
    marginBottom: 3,
    backgroundColor: "#fff",
    borderColor: "#292d31",
    borderWidth: 0,
  },
  resetBtnText: {
    color: "#2d2d2d",
    fontWeight: "700",
    fontSize: 15.5,
  },
  buttonContent: {
    height: 56,
  },
});
