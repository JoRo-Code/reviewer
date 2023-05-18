import endent from 'endent';
import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from 'eventsource-parser';

const TASK_DESCRIPTION = `
Your task is to perform a detailed review of the provided text.
  In your feedback, please focus on these aspects:

  1. **Grammar:** Correct any grammatical errors such as incorrect verb tenses, misplaced punctuation, sentence fragments, etc. 
  2. **Typos:** Fix any spelling mistakes or typographical errors you find.
  3. **Completeness of Information:** Assess whether the text provides a full understanding of the topic being discussed. Suggest where more details or explanations could be added.
  4. **Word Choice:** Check if the chosen words, phrases, and expressions are clear, precise, and effective.
  5. **Accuracy** Be critical, is the information accurate?
  
  Give feedback on this text. Give the feedack as a html ordered list.
      
  After the listed feedback, output the original text with your comments annotated. 
  
  Make sure to not change the original text, only add your annotated comments.
  Also, use a <hr>-tag to separate the the feedback list and the annotated text. 

Colors:
    Dark Blue (#00008B) is used for incorrect form or grammar.
    Dark Red (#8B0000) is used for typographical errors.
    Purple (#800080) is used for ambiguous or unclear phrases.
    Dark Green (#006400) is used for places where additional clarity could be beneficial.
    Dark Orange (#cc5500) is used for questionable statements.

  If the original text is:
    The quick brown fox jumps over the lazzy dog. It's an old sentence used for demonstrating all alphabets. However its not much usefull outside that.
  
  The feedback list should look like this:
<ol>
    <li><strong>Grammar:</strong> Correct the grammatical errors - use "It's" at the start of sentences, place a comma after "However," and use "it's" instead of "its" when it means "it is."</li>
    <li><strong>Typos:</strong> Fix the spelling mistakes - "lazzy" should be "lazy," and "usefull" should be "useful."</li>
    <li><strong>Completeness of Information:</strong> Elaborate on why the sentence demonstrates all alphabets, and include that pangrams are also used in typography and keyboarding practice.</li>
    <li><strong>Word Choice:</strong> Replace "old sentence" with "classic sentence" or "well-known phrase," and consider rephrasing "not much usefull outside that" to "has limited practical use beyond this."</li>
    <li><strong>Accuracy:</strong> Correct the assertion that the sentence has limited use beyond demonstrating all alphabets, pointing out its other uses in typography and keyboarding practice.</li>
</ol>
  
  and the annotated original text should follow this pattern: 
    <p> other_part <span style="background-color: color title="error_type. comment."> commented_part</span> other_part </p>
  
  so as a concrete example:
    <p> However, its <span style="background-color: #cc5500" title="Accuracy: Point out other uses of the sentence in typography and keyboarding practice.">not much usefull</span><span style="background-color: #800080" title="Word Choice: Consider rephrasing 'its not much useful outside that' to 'has limited practical use beyond this.'"> outside that.</span></p>

 Make sure to only span the part of the text that is of interest for the comment, and insert the appropriate comment in the title-attribute.
 Also, use <hr>-tags to separate the feedback list and annotated text.
`

const createPrompt = (
  inputLanguage: string,
  outputLanguage: string,
  inputCode: string,
) => endent`

  ${TASK_DESCRIPTION}

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
