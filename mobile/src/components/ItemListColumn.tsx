import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

type Props = Readonly<{
    title: string;
    items: string[];
    testID?: string;
}>;

export default function ItemListColumn({ title, items, testID }: Props) {
    return (
        <View testID={testID} style={styles.column}>
            <Text style={styles.columnHeader}>{title}</Text>
            <ScrollView style={{ flexGrow: 0 }} showsVerticalScrollIndicator>
                {items.map((item) => (
                    <Text key={item} style={styles.itemText}>
                        {item}
                    </Text>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    column: {
        flex: 1,
        paddingHorizontal: 4,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 8,
        paddingLeft: 10
    },
    columnHeader: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
        paddingBottom: 4,
    },
    itemText: {
        fontSize: 13,
        color: '#444',
        paddingVertical: 3,
        lineHeight: 18,
        paddingRight: 6
    }
});
