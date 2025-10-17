import { client, CollectionId, database, DatabaseId } from "@/lib/appwrite";
import React, { useEffect, useRef, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Query } from "react-native-appwrite";
import { Card, Paragraph, Searchbar, Text } from "react-native-paper";

type UserProfile = {
  $id: string;
  name: string;
  email: string;
  city?: string;
  state?: string;
  pincode?: string;
  isPublic: boolean;
  mobile?: string;
  age?: number;
  address?: string;
};

export default function Home() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const subscriptionRef = useRef<(() => void) | null>(null);

  // Fetch public profiles initially
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await database.listDocuments(
        DatabaseId,
        CollectionId,
        [Query.equal("isPublic", true)]
      );
      setUsers(response.documents as unknown as UserProfile[]);
      setFilteredUsers(response.documents as unknown as UserProfile[]);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();

    // Subscribe to real-time DB changes on the collection
    subscriptionRef.current = client.subscribe(
      [`databases.${DatabaseId}.collections.${CollectionId}.documents`],
      (response) => {
        const updatedProfile = response.payload as UserProfile;

        // Instead of re-fetching, we update the state locally
        setUsers((currentUsers) => {
          const userIndex = currentUsers.findIndex(
            (u) => u.$id === updatedProfile.$id
          );

          // If user is not public, remove them from the list if they exist
          if (!updatedProfile.isPublic) {
            if (userIndex > -1) {
              return currentUsers.filter((u) => u.$id !== updatedProfile.$id);
            }
            return currentUsers;
          }

          // If user exists, update it. Otherwise, add it.
          const newUsers = [...currentUsers];
          userIndex > -1 ? (newUsers[userIndex] = updatedProfile) : newUsers.push(updatedProfile);
          return newUsers;
        });
      }
    );

    // Cleanup subscription on unmount
    return () => {
      // The subscribe method returns the unsubscribe function directly.
      subscriptionRef.current?.();
    };
  }, []);

  // Filter users locally based on search query
  useEffect(() => {
    const lowerQuery = searchQuery.toLowerCase().trim();
    if (!lowerQuery) {
      setFilteredUsers(users);
      return;
    }
    const filtered = users.filter((user) =>
      (user.name?.toLowerCase().includes(lowerQuery) ||
       user.city?.toLowerCase().includes(lowerQuery))
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const renderItem = ({ item }: { item: UserProfile }) => (
    <Card style={styles.card} elevation={2}>
      <Card.Title title={item.name} subtitle={item.email} />
      <Card.Content>
        <Paragraph>
          City: {item.city || "N/A"} | State: {item.state || "N/A"} | Age: {item.age || "N/A"}
        </Paragraph>
        <Paragraph>Mobile: {item.mobile || "N/A"}</Paragraph>
        <Paragraph>Address: {item.address || "N/A"}</Paragraph>
        <Paragraph>Public Profile: {item.isPublic ? "Yes" : "No"}</Paragraph>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Public User Profiles</Text>

      <Searchbar
        placeholder="Search by name or city"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        autoCapitalize="none"
      />

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.$id}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={fetchUsers}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  searchBar: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 12,
  },
});
