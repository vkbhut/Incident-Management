import { defineConfig } from "allure";

export default defineConfig({
  name: "IncidentManagement",
  output: "./allure-report",
  plugins: {
    awesome: {
      options: {
        singleFile: true,
        reportLanguage: "en",
      },
    },
  },
});
