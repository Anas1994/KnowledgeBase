import "@/App.css";
import HealthOS from "./components/NotebookLM_Workspace";
import { LanguageProvider } from "./i18n/LanguageContext";

function App() {
  return (
    <LanguageProvider>
      <HealthOS />
    </LanguageProvider>
  );
}

export default App;
