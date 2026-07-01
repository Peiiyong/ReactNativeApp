import { useState } from "react";
import { Button, TextInput, View } from "react-native";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button
        title="Sign Up"
        onPress={() => {}}
      />
    </View>
  );
}