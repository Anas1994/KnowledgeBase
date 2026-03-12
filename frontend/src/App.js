import "@/App.css";
import HealthOS from "./components/NotebookLM_Workspace";
import { LanguageProvider } from "./i18n/LanguageContext";
import { ThemeProvider } from "./theme/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <HealthOS />
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
