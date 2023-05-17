import endent from 'endent';
import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from 'eventsource-parser';

const INPUT_OUTPUT_EXAMPLE = `
  If the original sentence is::
    The quick brown fox jumps over the lazzy dog. It's an old sentence used for demonstrating all alphabets. However it's not much usefull outside that.

  Your HTML annotated sentence should look like: 
    <p>The quick brown fox jumps over the <span style="background-color: #8B0000" title="Typographical error. The correct spelling is 'lazy'.">lazzy</span> dog. <span style="background-color: #800080" title="Ambiguous pronoun reference. Consider revising to 'This is an old sentence...'">It's</span> an old sentence used for demonstrating all <span style="background-color: #006400" title="Consider revising for clarity. Perhaps 'all the letters of the alphabet' would work better.">alphabets</span>. However <span style="background-color: #00008B" title="Incorrect form. Use 'it's' instead of 'it' to mean 'it is'.">it's</span> not much <span style="background-color: #8B0000" title="Incorrect word usage. Use 'useful' instead of 'usefull'.">usefull</span> outside that.</p>

`

const createPrompt = (
  inputLanguage: string,
  outputLanguage: string,
  inputCode: string,
) => endent`
As an advanced AI language model, your task is to perform a detailed review of the provided text. Your feedback should be interwoven directly into the original text using HTML '<span>' tags for annotations. Your comments should appear when hovering over the highlighted sections. Here's how to do it: wrap the section you are referring to in '<span style="background-color: color" title="Your comment here">highlighted text</span>'.

Remember: Do NOT use <!-- --> comments, as they will not be visible when hovering over the text. 

In your review, please focus on these aspects:

1. **Grammar:** Correct any grammatical errors such as incorrect verb tenses, misplaced punctuation, sentence fragments, etc. 
2. **Typos:** Fix any spelling mistakes or typographical errors you find.
3. **Completeness of Information:** Assess whether the text provides a full understanding of the topic being discussed. Suggest where more details or explanations could be added.
4. **Word Choice:** Check if the chosen words, phrases, and expressions are clear, precise, and effective.

Colors:
    Dark Blue (#00008B) is used for incorrect form or grammar.
    Dark Red (#8B0000) is used for typographical errors.
    Purple (#800080) is used for ambiguous or unclear phrases.
    Dark Green (#006400) is used for places where additional clarity could be beneficial.

Here's a clear example of what you should do:
  
  ${INPUT_OUTPUT_EXAMPLE}

  Your goal is to help improve the overall quality and clarity of the text.

  Input text:
  ${inputCode}
  `;

export const OpenAIStream = async (
  inputLanguage: string,
  outputLanguage: string,
  inputCode: string,
  model: string,
  key: string,
) => {
  const prompt = createPrompt(inputLanguage, outputLanguage, inputCode);

  const system = { role: 'system', content: prompt };

  const res = await fetch(`https://api.openai.com/v1/chat/completions`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key || process.env.OPENAI_API_KEY}`,
    },
    method: 'POST',
    body: JSON.stringify({
      model,
      messages: [system],
      temperature: 0,
      stream: true,
    }),
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  if (res.status !== 200) {
    const statusText = res.statusText;
    const result = await res.body?.getReader().read();
    throw new Error(
      `OpenAI API returned an error: ${
        decoder.decode(result?.value) || statusText
      }`,
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const data = event.data;

          if (data === '[DONE]') {
            controller.close();
            return;
          }

          try {
            const json = JSON.parse(data);
            const text = json.choices[0].delta.content;
            const queue = encoder.encode(text);
            controller.enqueue(queue);
          } catch (e) {
            controller.error(e);
          }
        }
      };

      const parser = createParser(onParse);

      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });

  return stream;
};
