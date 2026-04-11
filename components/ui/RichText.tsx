/**
 * Renders a string with **bold** markers and \n\n as paragraph breaks.
 */
export function RichText({ text }: { text: string }) {
  const paragraphs = text.split("\n\n");

  return (
    <>
      {paragraphs.map((para, pi) => {
        const parts = para.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={pi}>
            {pi > 0 && <><br /><br /></>}
            {parts.map((part, i) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong key={i} className="font-bold text-stone-900">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return <span key={i}>{part}</span>;
            })}
          </span>
        );
      })}
    </>
  );
}
