import React, { useState, useEffect, useRef } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Type } from 'lucide-react';

const TypingGame = () => {
  const [files, setFiles] = useState({});
  const [selectedFile, setSelectedFile] = useState('');
  const [currentText, setCurrentText] = useState('');
  const [targetText, setTargetText] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [errors, setErrors] = useState([]);
  const [processedText, setProcessedText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentLine, setCurrentLine] = useState(0);
  const [nextTypingPosition, setNextTypingPosition] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const codeDisplayRef = useRef(null);
  const activeLineRef = useRef(null);
  const textareaRef = useRef(null);

  // Dark mode 설정을 localStorage에 저장
  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(darkMode);
    document.documentElement.classList.toggle('dark', darkMode);
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  useEffect(() => {
    fetch('/api/files')
      .then(res => res.json())
      .then(data => {
        setFiles(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load files:', err);
        setError('파일을 불러오는데 실패했습니다.');
        setIsLoading(false);
      });
  }, []);

  const processFileContent = (content) => {
    return content
      .replace(/\r\n/g, '\n')
      .replace(/\t/g, '    ');
  };

  const findNextTypingPosition = (text) => {
    const lines = text.split('\n');
    let position = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().length > 0) {
        return position + lines[i].search(/\S/);
      }
      position += line.length + 1;
    }
    return 0;
  };

  useEffect(() => {
    if (selectedFile && files[selectedFile]) {
      const processed = processFileContent(files[selectedFile]);
      setTargetText(processed);
      setProcessedText(processed);
      const nextPos = findNextTypingPosition(processed);
      setNextTypingPosition(nextPos);
      resetGame();
    }
  }, [selectedFile, files]);

  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentLine]);

  useEffect(() => {
    if (textareaRef.current && nextTypingPosition > 0) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(nextTypingPosition, nextTypingPosition);
      
      if (nextTypingPosition > 0) {
        const initialText = processedText.slice(0, nextTypingPosition);
        setCurrentText(initialText);
      }
    }
  }, [nextTypingPosition, processedText]);

  const handleFileSelect = (value) => {
    setSelectedFile(value);
  };

  const handleTyping = (e) => {
    const typed = e.target.value;
    
    if (!startTime && typed.length > nextTypingPosition) {
      setStartTime(Date.now());
    }

    setCurrentText(typed);

    const currentPos = typed.length;
    const textUntilCursor = processedText.slice(0, currentPos);
    const lineCount = (textUntilCursor.match(/\n/g) || []).length;
    setCurrentLine(lineCount);

    const newErrors = [];
    const typedChars = typed.split('');
    const targetChars = processedText.slice(0, typed.length).split('');
    
    for (let i = 0; i < typedChars.length; i++) {
      if (typedChars[i] !== targetChars[i]) {
        newErrors.push(i);
      }
    }
    setErrors(newErrors);

    if (typed.length === processedText.length && !newErrors.length) {
      setEndTime(Date.now());
      setShowResults(true);
    }
  };

  const resetGame = () => {
    setCurrentText('');
    setStartTime(null);
    setEndTime(null);
    setShowResults(false);
    setErrors([]);
    setCurrentLine(0);
  };

  const calculateResults = () => {
    const timeInSeconds = (endTime - startTime) / 1000;
    const wordsTyped = processedText.split(' ').length;
    const wpm = Math.round((wordsTyped / timeInSeconds) * 60);
    const accuracy = Math.round(((processedText.length - errors.length) / processedText.length) * 100);
    
    return {
      wpm,
      accuracy,
      timeInSeconds: timeInSeconds.toFixed(1)
    };
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <Card>
          <CardContent className="p-4">
            파일을 불러오는 중...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <Card>
          <CardContent className="p-4 text-red-500">
            {error}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>코드 타이핑 게임</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className="w-10 h-10"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select onValueChange={handleFileSelect} value={selectedFile}>
              <SelectTrigger>
                <SelectValue placeholder="파일을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(files).map(filename => (
                  <SelectItem key={filename} value={filename}>
                    {filename}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedFile && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  ref={codeDisplayRef}
                  className="h-[calc(100vh-280px)] overflow-y-auto p-4 bg-gray-100 dark:bg-gray-800 rounded font-mono whitespace-pre-wrap break-all"
                >
                  {processedText.split('\n').map((line, lineNum) => (
                    <div
                      key={lineNum}
                      ref={lineNum === currentLine ? activeLineRef : null}
                      className={`transition-all duration-150 min-h-6 ${
                        lineNum === currentLine ? 'bg-blue-100 dark:bg-blue-900' : ''
                      }`}
                    >
                      {line.split('').map((char, charIndex) => {
                        const globalIndex = processedText.split('\n')
                          .slice(0, lineNum)
                          .join('\n').length + (lineNum > 0 ? 1 : 0) + charIndex;
                        
                        return (
                          <span
                            key={charIndex}
                            className={`transition-all duration-150 ${
                              globalIndex < currentText.length
                                ? errors.includes(globalIndex)
                                  ? 'bg-red-300 dark:bg-red-800'
                                  : 'bg-green-300 dark:bg-green-800'
                                : ''
                            }`}
                          >
                            {char}
                          </span>
                        );
                      })}
                      {line.length === 0 && (
                        <span className="text-gray-400 dark:text-gray-500">⏎</span>
                      )}
                    </div>
                  ))}
                </div>

				<div className="h-[calc(100vh-280px)] flex flex-col">
				  <textarea
					ref={textareaRef}
					value={currentText}
					onChange={handleTyping}
					className="flex-1 p-4 font-mono border rounded resize-none dark:bg-gray-800 dark:text-white whitespace-pre-wrap break-all"
					placeholder="여기에 타이핑을 시작하세요..."
					disabled={showResults}
				  />
				</div>
              </div>

              <AlertDialog open={showResults}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>타이핑 결과</AlertDialogTitle>
                  </AlertDialogHeader>
                  {showResults && (
                    <div className="space-y-2">
                      <p>타이핑 속도: {calculateResults().wpm} WPM</p>
                      <p>정확도: {calculateResults().accuracy}%</p>
                      <p>소요 시간: {calculateResults().timeInSeconds}초</p>
                    </div>
                  )}
                  <AlertDialogFooter>
                    <AlertDialogAction onClick={resetGame}>
                      다시 시작하기
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TypingGame;
