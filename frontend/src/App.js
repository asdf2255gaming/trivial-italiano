import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import TrivialGame from "./pages/TrivialGame";
import { ThemeProvider } from "./contexts/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<TrivialGame />} />
          </Routes>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  );
}

export default App;
