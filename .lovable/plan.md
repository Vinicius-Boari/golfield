I will implement a network-based access restriction. Since I cannot directly whitelist IPs at the infrastructure level in this environment, I will implement a client-side check that validates the user's public IP against a "trusted" IP (the one you are currently using).

### Steps:
1. **Identify Trusted IP**: I will detect your current public IP address.
2. **Create IP Guard Component**: I will build a component that fetches the visitor's public IP and compares it to the trusted one.
3. **Protect the Dashboard**: I will wrap the main dashboard content with this guard. If the IPs don't match, an "Access Denied" screen will be shown.
4. **Fallback/Login**: I will provide a simple password-based fallback or just a clear message that the network is not authorized.

**Note**: This is a security-by-software approach. For a more robust solution, I recommend using Supabase Auth with specific email domains, but for the "same network" requirement, this IP-matching method is the direct implementation.

### Technical Details:
- Use `https://api.ipify.org?format=json` to detect the visitor's IP.
- Store the allowed IP in a constant or environment variable.
- Create a `NetworkGuard` component in `src/routes/index.tsx`.
- Update the `DashboardPage` component to use this guard.