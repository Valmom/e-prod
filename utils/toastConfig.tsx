import React from "react";
import { StyleSheet, Text, View } from "react-native";

export const toastConfig = {
  successWithAction: ({ text1 }: any) => (
    <View style={styles.container}>
      <Text style={styles.message}>{text1}</Text>
    </View>
  ),
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    padding: 12,
    borderLeftWidth: 5,
    borderLeftColor: "#22c55e",
    borderRadius: 8,
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 9999,
  },
  message: {
    fontSize: 14,
    color: "#111",
  },
});
