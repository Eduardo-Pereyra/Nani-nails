export default { async rewrites() { return [{ source: "/", destination: "/index.html" }, { source: "/admin", destination: "/admin.html" }]; } };
