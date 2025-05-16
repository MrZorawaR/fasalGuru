import { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Volume2 } from "lucide-react";
import "./index.css";

function App() {
  const [chatHistory, setChatHistory] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [generatingAnswer, setGeneratingAnswer] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatContainerRef = useRef(null);

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, generatingAnswer]);

  const handleVoiceInput = () => {
    if (!recognition) {
      console.error("SpeechRecognition is not supported in this browser.");
      return;
    }

    setIsListening(true);
    recognition.start();

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (e) => {

      const transcript = e.results[0][0].transcript;
      setQuestion(transcript);
      setIsListening(false);
    };

    recognition.onerror = (e) => {
      console.error("Speech recognition error:", e);
      setIsListening(false);
    };

    recognition.onresult = (e) => {

      const transcript = e.results[0][0].transcript.trim(); 
      setQuestion(transcript);
    };

    recognition.onresult = (e) => {

      const transcript = e.results[0][0].transcript.trim();

      setQuestion(transcript);

      generateAnswer(null, transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  const speakAnswer = (text) => {
    const result = text.replace(/\*/g, "");
    if (window.responsiveVoice) {
      window.responsiveVoice.speak(result, "Hindi Female", {
        rate: 1,
        pitch: 1,
        volume: 1,
      });
    }
  };

  async function generateAnswer(e, customQuestion) {
    if (e) e.preventDefault();

    const currentQuestion = customQuestion || question;
    if (!currentQuestion.trim()) return;

    setGeneratingAnswer(true);
    setQuestion("");

    setChatHistory([]);

    setChatHistory((prev) => [
      ...prev,
      { type: "question", content: currentQuestion },
    ]);

    try {
      const response = await axios({
        url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyBfydMVeTuKMaIF2DekcUE9hGrYkGXj3A0",
        method: "post",
        data: {
          contents: [{ parts: [{ text: currentQuestion }] }],
        },
      });

      const aiResponse = response.data.candidates[0].content.parts[0].text;
      setChatHistory((prev) => [
        ...prev,
        { type: "answer", content: aiResponse },
      ]);
      setAnswer(aiResponse);
      // speakAnswer(aiResponse);
    } catch (error) {
      console.error(error);
      const errorMessage =
        "माफ़ कीजिए, कुछ गलत हो गया। कृपया दुबारा कोशिश करें।";
      setChatHistory((prev) => [
        ...prev,
        { type: "answer", content: errorMessage },
      ]);
      setAnswer(errorMessage);
      speakAnswer(errorMessage);
    }

    setGeneratingAnswer(false);
  }

  function handleQuestionClick(e) {
    const question = e.target.closest(".inbuilt-questions").innerText.trim();
    generateAnswer(null, question);
  }

 return (
  <div className="fixed inset-0 bg-gradient-to-r from-blue-50 to-blue-100 animate-fade-in">
    <div className="h-full max-w-4xl mx-auto flex flex-col p-3">
      <header className="text-center py-4">
        <h1 className="text-4xl font-bold text-blue-500 hover:text-blue-600 transition-colors duration-300 hover:scale-105 transform">
          FasalGuru's Chat AI
        </h1>
      </header>

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto mb-4 rounded-lg bg-white shadow-lg p-4 hide-scrollbar animate-fade-in-slow"
      >
        {chatHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 animate-fade-in">
            <div className="bg-blue-50 rounded-xl p-8 max-w-2xl shadow-md transition-transform duration-500 hover:scale-105">
              <h2 className="text-2xl font-bold text-blue-600 hover:text-blue-800 mb-4 transition-colors">
                Welcome to FasalGuru! 👋
              </h2>
              <p className="text-gray-600 mb-4">
                मैं आपकी हर उस चीज़ में मदद करने के लिए यहाँ हूँ जो आप जानना
                चाहते हैं। आप मुझसे निम्न के बारे में पूछ सकते हैं:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                {[
                  ["🌾", "कृषि टिप्स"],
                  ["📊", "फसल प्रबंधन जानकारी"],
                  ["💧", "सिंचाई एवं खाद संबंधी सलाह"],
                  ["🚜", "कृषि उपकरण सुझाव"],
                ].map(([icon, text], idx) => (
                  <div
                    key={idx}
                    className="inbuilt-questions bg-white p-4 rounded-lg shadow-sm hover:cursor-pointer transition-all duration-300 hover:scale-105"
                    onClick={handleQuestionClick}
                  >
                    <span className="text-blue-500">{icon}</span> {text}
                  </div>
                ))}
              </div>
              <p className="text-gray-500 mt-6 text-sm">
                बस नीचे अपना प्रश्न बोलें या लिखें और Enter दबाएं या Send पर
                क्लिक करें!
              </p>
            </div>
          </div>
        ) : (
          <>
            {chatHistory.map((chat, index) => (
              <div
                key={index}
                className={`mb-4 items-center transition-all duration-500 ${
                  chat.type === "question"
                    ? "text-right animate-slide-in-right"
                    : "text-left animate-slide-in-left"
                }`}
              >
                <div
                  className={`inline-block max-w-[80%] p-3 rounded-lg overflow-auto hide-scrollbar ${
                    chat.type === "question"
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-800 rounded-bl-none"
                  }`}
                >
                  <ReactMarkdown className="overflow-auto hide-scrollbar">
                    {chat.content}
                  </ReactMarkdown>
                </div>
                {chat.type === "answer" && (
                  <button
                    onClick={() => speakAnswer(answer)}
                    className="ml-2 mt-5 px-2 py- rounded-md hover:bg-gray-100 hover:opacity-50 transition-all hover:scale-105"
                  >
                    <Volume2 />
                  </button>
                )}
              </div>
            ))}
          </>
        )}
        {generatingAnswer && (
          <div className="text-left">
            <div className="inline-block bg-gray-100 p-3 rounded-lg animate-pulse">
              सोच रहा हूँ....
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => generateAnswer(e, null)}
        className="bg-white rounded-lg shadow-lg p-4 animate-fade-in"
      >
        <div className="flex gap-2">
          <input
            required
            className="flex-1 border border-gray-300 rounded p-3 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none transition-all"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="कुछ पूछो..."
            rows="2"
          ></input>
          <button
            type="button"
            onClick={handleVoiceInput}
            className={`px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-transform duration-300 hover:scale-105 ${
              isListening || generatingAnswer ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isListening || generatingAnswer}
          >
            🎙️ {isListening ? "Listening..." : "Speak"}
          </button>
          <button
            type="submit"
            className={`px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-transform duration-300 hover:scale-105 ${
              generatingAnswer ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={generatingAnswer}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  </div>
);

}

export default App;
