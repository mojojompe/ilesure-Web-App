// vite.config.ts
import { defineConfig } from "file:///C:/Users/HP/Desktop/Work/React/ileSure%20Dir/ilesure-web-app/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/HP/Desktop/Work/React/ileSure%20Dir/ilesure-web-app/node_modules/@vitejs/plugin-react/dist/index.js";
var vite_config_default = defineConfig(({ command }) => ({
  // Pinned so the backend can name a real origin in CORS_ORIGIN and
  // OAUTH_ALLOWED_ORIGINS. Vite otherwise takes 5173 and counts upward, so which app
  // got which port depended on the order they were started in, which meant Google
  // sign-in worked or failed by luck. strictPort fails loudly instead of drifting.
  server: { port: 5274, strictPort: true },
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // PERF-FIX (QA-PERF-001): this app shipped as ONE monolithic JS chunk, so every
        // user downloaded and parsed the entire application, every role's screens,
        // before first render. Split vendors out, mirroring ilesure-home, which already
        // does this correctly.
        // PERF-FIX (QA-PERF-001): only LEAF packages are split out. Splitting react
        // itself created a `vendor -> vendor-react -> vendor` cycle, because other
        // vendor code imports react, Rollup warns and chunk load order gets fragile.
        // Icon packs must be matched before anything containing "react", since they
        // live at @hugeicons/react and react-icons.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("lucide-react") || id.includes("@hugeicons") || id.includes("react-icons")) return "vendor-icons";
          if (id.includes("framer-motion") || id.includes("gsap")) return "vendor-animation";
          if (id.includes("recharts") || id.includes("d3-")) return "vendor-charts";
          if (id.includes("antd") || id.includes("@ant-design") || id.includes("rc-")) return "vendor-antd";
          return "vendor";
        }
      }
    }
  },
  esbuild: {
    drop: command === "build" ? ["console", "debugger"] : []
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxIUFxcXFxEZXNrdG9wXFxcXFdvcmtcXFxcUmVhY3RcXFxcaWxlU3VyZSBEaXJcXFxcaWxlc3VyZS13ZWItYXBwXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxIUFxcXFxEZXNrdG9wXFxcXFdvcmtcXFxcUmVhY3RcXFxcaWxlU3VyZSBEaXJcXFxcaWxlc3VyZS13ZWItYXBwXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9IUC9EZXNrdG9wL1dvcmsvUmVhY3QvaWxlU3VyZSUyMERpci9pbGVzdXJlLXdlYi1hcHAvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xyXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnXHJcblxyXG4vLyBTRUNVUklUWS1GSVggKFctTTMpOiBzdHJpcCBhbGwgY29uc29sZS4qIGFuZCBkZWJ1Z2dlciBzdGF0ZW1lbnRzIGZyb20gUFJPRFVDVElPTlxyXG4vLyBidWlsZHMgc28gUElJIC8gdG9rZW5zIC8gc29ja2V0IGludGVybmFscyBhcmVuJ3Qgc2hpcHBlZCB0byBlbmQgdXNlcnMuIEtlcHQgaW50YWN0IGluXHJcbi8vIGRldiAoY29tbWFuZCA9PT0gJ3NlcnZlJykgdG8gcHJlc2VydmUgZGV2ZWxvcGVyIGVyZ29ub21pY3MuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBjb21tYW5kIH0pID0+ICh7XHJcbiAgLy8gUGlubmVkIHNvIHRoZSBiYWNrZW5kIGNhbiBuYW1lIGEgcmVhbCBvcmlnaW4gaW4gQ09SU19PUklHSU4gYW5kXHJcbiAgLy8gT0FVVEhfQUxMT1dFRF9PUklHSU5TLiBWaXRlIG90aGVyd2lzZSB0YWtlcyA1MTczIGFuZCBjb3VudHMgdXB3YXJkLCBzbyB3aGljaCBhcHBcclxuICAvLyBnb3Qgd2hpY2ggcG9ydCBkZXBlbmRlZCBvbiB0aGUgb3JkZXIgdGhleSB3ZXJlIHN0YXJ0ZWQgaW4sIHdoaWNoIG1lYW50IEdvb2dsZVxyXG4gIC8vIHNpZ24taW4gd29ya2VkIG9yIGZhaWxlZCBieSBsdWNrLiBzdHJpY3RQb3J0IGZhaWxzIGxvdWRseSBpbnN0ZWFkIG9mIGRyaWZ0aW5nLlxyXG4gIHNlcnZlcjogeyBwb3J0OiA1Mjc0LCBzdHJpY3RQb3J0OiB0cnVlIH0sXHJcblxyXG4gIHBsdWdpbnM6IFtyZWFjdCgpXSxcclxuICBidWlsZDoge1xyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBvdXRwdXQ6IHtcclxuICAgICAgICAvLyBQRVJGLUZJWCAoUUEtUEVSRi0wMDEpOiB0aGlzIGFwcCBzaGlwcGVkIGFzIE9ORSBtb25vbGl0aGljIEpTIGNodW5rLCBzbyBldmVyeVxyXG4gICAgICAgIC8vIHVzZXIgZG93bmxvYWRlZCBhbmQgcGFyc2VkIHRoZSBlbnRpcmUgYXBwbGljYXRpb24sIGV2ZXJ5IHJvbGUncyBzY3JlZW5zLFxyXG4gICAgICAgIC8vIGJlZm9yZSBmaXJzdCByZW5kZXIuIFNwbGl0IHZlbmRvcnMgb3V0LCBtaXJyb3JpbmcgaWxlc3VyZS1ob21lLCB3aGljaCBhbHJlYWR5XHJcbiAgICAgICAgLy8gZG9lcyB0aGlzIGNvcnJlY3RseS5cclxuICAgICAgICAvLyBQRVJGLUZJWCAoUUEtUEVSRi0wMDEpOiBvbmx5IExFQUYgcGFja2FnZXMgYXJlIHNwbGl0IG91dC4gU3BsaXR0aW5nIHJlYWN0XHJcbiAgICAgICAgLy8gaXRzZWxmIGNyZWF0ZWQgYSBgdmVuZG9yIC0+IHZlbmRvci1yZWFjdCAtPiB2ZW5kb3JgIGN5Y2xlLCBiZWNhdXNlIG90aGVyXHJcbiAgICAgICAgLy8gdmVuZG9yIGNvZGUgaW1wb3J0cyByZWFjdCwgUm9sbHVwIHdhcm5zIGFuZCBjaHVuayBsb2FkIG9yZGVyIGdldHMgZnJhZ2lsZS5cclxuICAgICAgICAvLyBJY29uIHBhY2tzIG11c3QgYmUgbWF0Y2hlZCBiZWZvcmUgYW55dGhpbmcgY29udGFpbmluZyBcInJlYWN0XCIsIHNpbmNlIHRoZXlcclxuICAgICAgICAvLyBsaXZlIGF0IEBodWdlaWNvbnMvcmVhY3QgYW5kIHJlYWN0LWljb25zLlxyXG4gICAgICAgIG1hbnVhbENodW5rcyhpZDogc3RyaW5nKSB7XHJcbiAgICAgICAgICBpZiAoIWlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKSkgcmV0dXJuO1xyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdsdWNpZGUtcmVhY3QnKSB8fCBpZC5pbmNsdWRlcygnQGh1Z2VpY29ucycpIHx8IGlkLmluY2x1ZGVzKCdyZWFjdC1pY29ucycpKSByZXR1cm4gJ3ZlbmRvci1pY29ucyc7XHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ2ZyYW1lci1tb3Rpb24nKSB8fCBpZC5pbmNsdWRlcygnZ3NhcCcpKSByZXR1cm4gJ3ZlbmRvci1hbmltYXRpb24nO1xyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdyZWNoYXJ0cycpIHx8IGlkLmluY2x1ZGVzKCdkMy0nKSkgcmV0dXJuICd2ZW5kb3ItY2hhcnRzJztcclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnYW50ZCcpIHx8IGlkLmluY2x1ZGVzKCdAYW50LWRlc2lnbicpIHx8IGlkLmluY2x1ZGVzKCdyYy0nKSkgcmV0dXJuICd2ZW5kb3ItYW50ZCc7XHJcbiAgICAgICAgICByZXR1cm4gJ3ZlbmRvcic7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgZXNidWlsZDoge1xyXG4gICAgZHJvcDogY29tbWFuZCA9PT0gJ2J1aWxkJyA/IFsnY29uc29sZScsICdkZWJ1Z2dlciddIDogW10sXHJcbiAgfSxcclxufSkpXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBa1gsU0FBUyxvQkFBb0I7QUFDL1ksT0FBTyxXQUFXO0FBS2xCLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsUUFBUSxPQUFPO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUs1QyxRQUFRLEVBQUUsTUFBTSxNQUFNLFlBQVksS0FBSztBQUFBLEVBRXZDLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixPQUFPO0FBQUEsSUFDTCxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsUUFVTixhQUFhLElBQVk7QUFDdkIsY0FBSSxDQUFDLEdBQUcsU0FBUyxjQUFjLEVBQUc7QUFDbEMsY0FBSSxHQUFHLFNBQVMsY0FBYyxLQUFLLEdBQUcsU0FBUyxZQUFZLEtBQUssR0FBRyxTQUFTLGFBQWEsRUFBRyxRQUFPO0FBQ25HLGNBQUksR0FBRyxTQUFTLGVBQWUsS0FBSyxHQUFHLFNBQVMsTUFBTSxFQUFHLFFBQU87QUFDaEUsY0FBSSxHQUFHLFNBQVMsVUFBVSxLQUFLLEdBQUcsU0FBUyxLQUFLLEVBQUcsUUFBTztBQUMxRCxjQUFJLEdBQUcsU0FBUyxNQUFNLEtBQUssR0FBRyxTQUFTLGFBQWEsS0FBSyxHQUFHLFNBQVMsS0FBSyxFQUFHLFFBQU87QUFDcEYsaUJBQU87QUFBQSxRQUNUO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFFQSxTQUFTO0FBQUEsSUFDUCxNQUFNLFlBQVksVUFBVSxDQUFDLFdBQVcsVUFBVSxJQUFJLENBQUM7QUFBQSxFQUN6RDtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbXQp9Cg==
