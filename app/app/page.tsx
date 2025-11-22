'use client';

import { useState } from 'react';

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [originalText, setOriginalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');

  const toggleListening = () => {
    setIsListening(!isListening);
    // TODO: Wire up to speech-to-text, text-to-script, text-to-speech functions
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">AI Lecturer Translator</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Transforming bad lectures into great ones, in real-time
          </p>
        </div>

        {/* Control Button */}
        <div className="flex justify-center">
          <button
            onClick={toggleListening}
            className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isListening ? '⏹ Stop Listening' : '🎤 Start Listening'}
          </button>
        </div>

        {/* Display Areas */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Original Text */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 min-h-[300px]">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
              Original Lecture
            </h2>
            <div className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {originalText || 'Waiting for audio...'}
            </div>
          </div>

          {/* Translated Text */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 min-h-[300px]">
            <h2 className="text-xl font-semibold mb-4 text-blue-700 dark:text-blue-300">
              AI Enhanced Lecture
            </h2>
            <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {translatedText || 'Enhanced version will appear here...'}
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        {isListening && (
          <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span>Listening...</span>
          </div>
        )}
      </div>
    </div>
  );
}
