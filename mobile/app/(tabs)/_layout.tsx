import { Tabs } from "expo-router";

export default function TabLayout() {
    return (
        <Tabs>
            <Tabs.Screen
                name="map"
                options={{
                    title: "Map",
                }}
            />
        </Tabs>
    );
}
