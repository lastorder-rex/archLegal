export function ResultList({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function ResultText({ text }: { text: string }) {
  return <pre className="result-text">{text}</pre>;
}

export function KakaoTalkIcon() {
  return (
    <span className="kakao-talk-icon" aria-hidden="true">
      TALK
    </span>
  );
}
