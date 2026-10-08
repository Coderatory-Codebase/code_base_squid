import { setServers } from "node:dns";

const configuredServers = process.env.DNS_SERVERS
  ?.split(",")
  .map((server) => server.trim())
  .filter((server) => server.length > 0);

if (configuredServers && configuredServers.length > 0) {
  setServers(configuredServers);
}
