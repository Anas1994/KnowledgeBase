import "@/App.css";
import KnowledgeBase from "./components/NotebookLM_Workspace";
import { LanguageProvider } from "./i18n/LanguageContext";
import { ThemeProvider } from "./theme/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <KnowledgeBase />
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
