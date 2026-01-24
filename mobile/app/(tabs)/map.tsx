import { View, Text, StyleSheet } from "react-native";

export default function MapScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Map Screen</Text>
            <Text style={styles.subtitle}>Your map will go here</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
    },
});
