import { StyleSheet, Text } from "react-native";

interface PageTitleProps {
  title: string;
}

export default function PageTitle({ title }: PageTitleProps) {
  return <Text style={styles.title}>{title}</Text>;
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 16,
    color: "#444",
  },
});
