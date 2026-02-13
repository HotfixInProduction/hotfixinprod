import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ConfirmButtonProps {
  onPress: () => void;      // A function that returns nothing
  disabled?: boolean;       // Optional boolean
  title?: string;           // Optional custom text
}

const ConfirmButton : React.FC<ConfirmButtonProps> = ({ 
  onPress, 
  disabled = false, 
  title = "Confirm Route" 
}) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            style={[styles.button, disabled && styles.disabled]}
            activeOpacity={0.8}
        >
            <Text style={styles.text}>{title}</Text>
        </TouchableOpacity>
    ); 
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#912338',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    backgroundColor: '#a1a1a1',
  },
  text: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default ConfirmButton;