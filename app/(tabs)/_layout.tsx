import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Icon from "react-native-vector-icons/Feather";

// Custom header for tabs
function TabHeader({ title, iconName }: { title: string; iconName: string }) {
  return (
    <View style={styles.headerContainer}>
      <Icon name={iconName} size={22} color="#fff" style={styles.headerIcon} />
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#18181c",
        tabBarInactiveTintColor: "#888",
        tabBarLabelStyle: styles.tabLabel,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="users" color={color} size={size} />
          ),
          title: "Home",
          tabBarLabel: "All Profiles",
          header: () => <TabHeader title="All Profiles" iconName="users" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="user" color={color} size={size} />
          ),
          title: "Profile",
          tabBarLabel: "Your Profile",
          header: () => <TabHeader title="Your Profile" iconName="user" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: "#18181c",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 25,
    flexDirection: "row",
    alignItems: "center",
    boxShadow: "0 5px 17px rgba(24, 24, 24, 0.12)",
  },
  headerIcon: {
    marginRight: 12,
    marginLeft: 2,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 21,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginTop: 2,
  },
  tabBar: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    height: 68,
    paddingBottom: 4,
    borderTopWidth: 1.2,
    borderTopColor: "#ececec",
    boxShadow: "0 -4px 17px rgba(24, 24, 24, 0.13)",
  },
  tabLabel: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: "600",
  },
});
