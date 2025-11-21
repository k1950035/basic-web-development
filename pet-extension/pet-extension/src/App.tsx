import "./App.css";
import BackgroundFetcher from "./components/BackgroundFetcher.tsx";
import { useState } from "react";

function App() {
  const [petName, setPetName] = useState("강아지");
  return (
    <div className="flex flex-col w-[400px] h-[500px] bg-white">
      <div className="flex w-full h-[50px] bg-blue-600 items-center justify-between px-4">
        <div className="font-custom text-xl text-white">명언펫 {petName}</div>
        <button
          className="text-white px-3 py-1 bg-blue-800 rounded-md hover:bg-blue-900"
          onClick={() =>
            setPetName(prompt("펫의 이름을 입력하세요:", petName) || petName)
          }
        >
          이름 변경
        </button>
      </div>
      <BackgroundFetcher />
    </div>
  );
}

export default App;
