import { useState, useEffect, useCallback, useRef } from "react";

const ACCESS_KEY = process.env.REACT_APP_API_KEY;

const LS_KEY_COINS = "petExtensionCoins";
const LS_KEY_SCALE = "petExtensionScale";

const PET_IMAGE_PATH = "/assets/pet.png";

const DISPLAY_DURATION_MS = 5000;
const HIDDEN_DURATION_MS = 5000;

const UnsplashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    className="w-4 h-4 text-white drop-shadow-sm inline-block mr-1"
    fill="currentColor"
    aria-hidden="true"
  >
    <rect x="2" y="5" width="12" height="8" rx="1" ry="1" />
    <circle cx="8" cy="9" r="2" fill="white" />
    <path d="M4 5V3h8v2z" fill="currentColor" />
  </svg>
);

export default function App() {
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [photoCreditText, setPhotoCreditText] = useState("");
  const [photoLink, setPhotoLink] = useState("");
  const [loadingBackground, setLoadingBackground] = useState(false);
  const [message, setMessage] = useState("");
  const [adviceText, setAdviceText] = useState("");

  const [coins, setCoins] = useState(0);
  const [petScale, setPetScale] = useState(1.0);
  const PET_SCALE_COST = 10;
  const timersRef = useRef([]);

  const FONT_CLASSES = "font-pet-safe";

  useEffect(() => {
    const storedCoins = localStorage.getItem(LS_KEY_COINS);
    if (storedCoins !== null) {
      setCoins(parseInt(storedCoins, 10));
    }

    const storedScale = localStorage.getItem(LS_KEY_SCALE);
    if (storedScale !== null) {
      setPetScale(parseFloat(storedScale));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_KEY_COINS, coins.toString());
  }, [coins]);

  useEffect(() => {
    localStorage.setItem(LS_KEY_SCALE, petScale.toString());
  }, [petScale]);

  const fetchRandomBackground = useCallback(async () => {
    setLoadingBackground(true);
    setMessage("");

    const query = "retro%20pixel%20art%20game%20background";
    const url = `https://api.unsplash.com/photos/random?client_id=${ACCESS_KEY}&query=${query}&orientation=landscape`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      const imageUrl = data.urls.regular;

      setBackgroundImageUrl(imageUrl);
      setPhotoCreditText(`Photo by ${data.user.name}`);
      setPhotoLink(
        `${data.links.html}?utm_source=pet-extension&utm_medium=referral`
      );
    } catch (error) {
      console.error("Unsplash API call failed:", error);
      setBackgroundImageUrl("");
      setPhotoCreditText("배경 로드 실패. 다시 시도해 주세요.");
      setPhotoLink("");
    } finally {
      setLoadingBackground(false);
    }
  }, []);

  const fetchAdvice = useCallback(async () => {
    try {
      const response = await fetch("https://api.adviceslip.com/advice");
      if (!response.ok) {
        throw new Error(`Advice API error: ${response.status}`);
      }
      const data = await response.json();
      return data.slip.advice;
    } catch (error) {
      console.error("Advice API call failed:", error);
      return "음... 오늘은 조언이 생각이 안 나네.";
    }
  }, []); // Advice Loop: 5초 보이기, 10초 숨기기, 다음 루프 대기

  const adviceLoop = useCallback(async () => {
    // 1. 명언 가져오기
    const advice = await fetchAdvice(); // 2. 명언 표시 (5초)
    setAdviceText(advice); // 5초 후 명언 숨기기 타이머
    const hideTimer = setTimeout(() => {
      setAdviceText(""); // 명언 숨기기 // 10초 후 다음 루프 타이머
      const nextFetchTimer = setTimeout(adviceLoop, HIDDEN_DURATION_MS);
      timersRef.current.push(nextFetchTimer); // 타이머 정리 목록에 추가
    }, DISPLAY_DURATION_MS);

    timersRef.current.push(hideTimer); // 타이머 정리 목록에 추가
  }, [fetchAdvice]); // Initial background fetch and start advice loop

  useEffect(() => {
    fetchRandomBackground();
    adviceLoop(); // 컴포넌트 언마운트 시 모든 타이머 정리

    return () => timersRef.current.forEach(clearTimeout);
  }, [fetchRandomBackground, adviceLoop]); // --- IV. Game Logic --- // Function to increase coins when pet is clicked

  const increaseCoin = useCallback((amount = 1) => {
    setCoins((prevCoins) => prevCoins + amount); // Flash message for coin acquisition
    setMessage((prev) =>
      prev === "코인 획득!" ? "코인 획득!!" : "코인 획득!"
    );
    setTimeout(() => setMessage(""), 1000);
  }, []);

  const updatePetSize = useCallback(
    (delta) => {
      const newScale = Math.max(0.5, Math.min(2.0, petScale + delta));

      if (delta > 0) {
        if (coins >= PET_SCALE_COST) {
          setCoins((prevCoins) => prevCoins - PET_SCALE_COST);
          setPetScale(newScale);
          setMessage("펫 크기 증가!🎉");
        } else {
          setMessage(
            `코인이 부족해요! ${PET_SCALE_COST - coins}C 더 모아야 해요.`
          );
        }
      } else {
        setPetScale(newScale);
        setMessage("펫 크기 감소!");
      }
      setTimeout(() => setMessage(""), 1500);
    },
    [coins, petScale]
  );

  const containerClasses = `flex flex-col justify-between items-center p-4 h-full bg-[#e6f7ff] text-black transition-all duration-300 overflow-hidden`;

  const dynamicStyle = {
    backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : "none",
    backgroundSize: "cover",
    backgroundPosition: "center",
    minHeight: "400px",
    minWidth: "300px",
  };

  const textShadowClasses = `text-white drop-shadow-md ${FONT_CLASSES}`;

  return (
    <div className={containerClasses} style={dynamicStyle}>
      <div className="h-8 mb-2 w-full text-center">
        {message && (
          <p
            className={`bg-yellow-400 text-gray-800 text-sm font-semibold py-1 px-3 rounded-full inline-block shadow-lg animate-pulse ${FONT_CLASSES}`}
          >
            {message}
          </p>
        )}
      </div>
      <div className="flex-grow flex flex-col justify-center items-center w-full relative">
        {loadingBackground && (
          <p
            className={`text-lg font-bold text-gray-800 p-4 bg-white/70 rounded-lg ${FONT_CLASSES}`}
          >
            배경 로딩 중...
          </p>
        )}
        {!loadingBackground && backgroundImageUrl ? (
          <>
            <div
              className="relative transition-transform duration-300 cursor-pointer p-4 hover:scale-105"
              style={{ transform: `scale(${petScale})` }}
              onClick={() => increaseCoin(1)}
              title="클릭하여 코인 획득"
            >
              {adviceText && (
                <div
                  className={`absolute -top-16 left-1/2 transform -translate-x-1/2 bg-white text-gray-800 text-xs p-2 rounded-lg shadow-xl w-40 text-center ${FONT_CLASSES} z-10`}
                >
                  {adviceText}
                  <div className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
                </div>
              )}
              <img
                src={PET_IMAGE_PATH}
                alt="Pet Image"
                className="w-32 h-32 object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "https://placehold.co/128x128/000/fff?text=PET";
                }} // 이미지 로드 실패 대비
              />
            </div>
            <p
              className={`text-xl font-extrabold mt-4 ${textShadowClasses} bg-black/30 rounded-lg px-3 py-1`}
            >
              💰 코인: {coins}
            </p>
          </>
        ) : (
          <p
            className={`text-red-600 font-bold text-center p-4 bg-white/80 rounded-lg ${FONT_CLASSES}`}
          >
            {photoCreditText}
          </p>
        )}
      </div>
      <div className="w-full flex flex-col items-center space-y-3">
        <div className="flex space-x-2 p-2 bg-white/30 rounded-xl shadow-inner">
          <button
            onClick={() => updatePetSize(-0.1)}
            disabled={petScale <= 0.5}
            className={`px-4 py-2 text-sm bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition duration-150 shadow-md disabled:bg-gray-400 ${FONT_CLASSES}`}
          >
            크기 줄이기
          </button>
          <button
            onClick={() => updatePetSize(0.1)}
            disabled={coins < PET_SCALE_COST || petScale >= 2.0}
            className={`px-4 py-2 text-sm text-white font-semibold rounded-full transition duration-150 shadow-md ${FONT_CLASSES} ${
              coins >= PET_SCALE_COST && petScale < 2.0
                ? "bg-pink-500 hover:bg-pink-600"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            크기 키우기 ({PET_SCALE_COST}C)
          </button>
        </div>
        <button
          onClick={fetchRandomBackground}
          disabled={loadingBackground}
          className={`w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-150 shadow-lg disabled:bg-gray-400 ${FONT_CLASSES}`}
        >
          {loadingBackground ? "배경 찾는 중..." : "새로운 배경 뽑기"}
        </button>
        {photoCreditText && photoLink && (
          <p
            className={`text-xs text-white opacity-90 text-center px-1 ${FONT_CLASSES}`}
          >
            <UnsplashIcon />
            <a
              href={photoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-yellow-300 transition"
            >
              {photoCreditText}
            </a>
            on Unsplash
          </p>
        )}
      </div>
    </div>
  );
}
