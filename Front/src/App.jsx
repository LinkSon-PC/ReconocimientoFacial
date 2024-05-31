import "./App.css";
import InputImage from "./components/InputImage";
import LivenessDetection from "./components/LivenessDetection";

function App() {

  return (
    <div className="App">
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <header className="App-header">
          <h1 className="text-2xl font-bold mb-4">Liveness Detection App</h1>
        </header>
        <InputImage />
        <LivenessDetection />
      </div>
    </div>
  );
}

export default App;
