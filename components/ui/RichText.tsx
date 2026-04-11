/**
 * Renders a string with **bold** markers, «guillemet» quotes,
 * and \n\n as paragraph breaks.
 */
export function RichText({ text }: { text: string }) {
  const paragraphs = text.split("\n\n");

  return (
    <>
      {paragraphs.map((para, pi) => {
        const parts = para.split(/(\*\*[^*]+\*\*|«[^»]+»)/g);
        return (
          <span key={pi}>
            {pi > 0 && <><br /><br /></>}
            {parts.map((part, i) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong key={i} className="font-bold text-highlight-text">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              if (part.startsWith("«") && part.endsWith("»")) {
                return (
                  <span key={i} className="font-bold text-highlight-text">
                    {part}
                  </span>
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
