import { Redirect } from 'expo-router';
// Target for gadgethub://auth/callback so the router never shows "unmatched route".
export default function Callback() { return <Redirect href="/(tabs)" />; }
