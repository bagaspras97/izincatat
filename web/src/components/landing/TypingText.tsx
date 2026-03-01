'use client';

import { useEffect, useState } from 'react';

interface TypingTextProps {
  phrase: string;
  className?: string;
  speed?: number;
}

export function TypingText({
  phrase,
  className = '',
  speed = 75,
}: TypingTextProps) {
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    if (text.length === phrase.length) {
      setDone(true);
      return;
    }
    const timeout = setTimeout(() => {
      setText(phrase.slice(0, text.length + 1));
    }, speed);
    return () => clearTimeout(timeout);
  }, [text, done, phrase, speed]);

  return (
    <span className={className}>
      {text}
      {!done && <span className="typing-cursor" />}
    </span>
  );
}
